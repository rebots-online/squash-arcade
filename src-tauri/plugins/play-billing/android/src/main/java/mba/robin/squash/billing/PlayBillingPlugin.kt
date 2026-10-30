package mba.robin.squash.billing

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import androidx.appcompat.app.AppCompatActivity
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import com.android.billingclient.api.*
import org.json.JSONArray
import org.json.JSONObject

/** Store callbacks report evidence only. The authenticated server grants and acknowledges. */
@TauriPlugin
class PlayBillingPlugin(private val activity: Activity) : Plugin(activity) {
    private var connecting = false
    private var closed = false
    private var purchaseOpening = false
    private var purchasePaused = false
    private val mainHandler = Handler(Looper.getMainLooper())
    private val connectionTimeout = Runnable {
        finishConnection(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE).build())
    }
    private val connectionWaiters = mutableListOf<(BillingResult) -> Unit>()
    private val billing = BillingClient.newBuilder(activity)
        .setListener { result, purchases ->
            activity.runOnUiThread {
                purchaseOpening = false
                emitPurchases(result, purchases.orEmpty())
            }
        }
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .enableAutoServiceReconnection()
        .build()

    override fun load(webView: WebView) { refreshOnResume() }
    override fun onPause(activity: AppCompatActivity) {
        if (purchaseOpening) purchasePaused = true
    }
    override fun onResume(activity: AppCompatActivity) {
        // If Play's Activity was lost or canceled without a callback, ownership
        // re-query on return recovers the UI; an empty result never grants access.
        if (purchasePaused) { purchaseOpening = false; purchasePaused = false }
        refreshOnResume()
    }
    override fun onDestroy(activity: AppCompatActivity) {
        closed = true
        billing.endConnection()
        val error = BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.SERVICE_DISCONNECTED).build()
        finishConnection(error)
    }

    private fun connected(action: (BillingResult) -> Unit) {
        activity.runOnUiThread {
            if (closed) {
                action(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.SERVICE_DISCONNECTED).build())
            } else if (billing.isReady) {
                action(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.OK).build())
            } else {
                connectionWaiters.add(action)
                if (!connecting) {
                    connecting = true
                    mainHandler.postDelayed(connectionTimeout, 15000)
                    billing.startConnection(object : BillingClientStateListener {
                        override fun onBillingSetupFinished(result: BillingResult) {
                            activity.runOnUiThread { finishConnection(result) }
                        }
                        override fun onBillingServiceDisconnected() {
                            activity.runOnUiThread {
                                finishConnection(BillingResult.newBuilder()
                                    .setResponseCode(BillingClient.BillingResponseCode.SERVICE_DISCONNECTED).build())
                            }
                        }
                    })
                }
            }
        }
    }

    private fun finishConnection(result: BillingResult) {
        mainHandler.removeCallbacks(connectionTimeout)
        connecting = false
        val waiting = connectionWaiters.toList()
        connectionWaiters.clear()
        waiting.forEach { it(result) }
    }

    private fun failure(invoke: Invoke, result: BillingResult) {
        invoke.reject("Google Play could not complete this request. Retry or check your Play account.", "PLAY_${result.responseCode}")
    }

    private fun purchaseJson(purchase: Purchase): JSONObject = JSONObject().apply {
        put("purchaseToken", purchase.purchaseToken)
        put("products", JSONArray(purchase.products))
        put("state", when (purchase.purchaseState) {
            Purchase.PurchaseState.PURCHASED -> "purchased"
            Purchase.PurchaseState.PENDING -> "pending"
            else -> "unspecified"
        })
        put("acknowledged", purchase.isAcknowledged)
        put("suspended", purchase.isSuspended)
    }

    private fun emitPurchases(result: BillingResult, purchases: List<Purchase>) {
        val payload = JSObject()
        payload.put("code", result.responseCode)
        payload.put("status", when {
            result.responseCode == BillingClient.BillingResponseCode.USER_CANCELED -> "canceled"
            result.responseCode != BillingClient.BillingResponseCode.OK -> "error"
            purchases.any { it.purchaseState == Purchase.PurchaseState.PENDING } -> "pending"
            purchases.any { it.purchaseState == Purchase.PurchaseState.PURCHASED } -> "purchased"
            else -> "restored"
        })
        payload.put("purchases", JSONArray(purchases.map(::purchaseJson)))
        trigger("purchases", payload)
    }

    private fun queryOwned(done: (BillingResult, List<Purchase>) -> Unit) {
        val found = mutableListOf<Purchase>()
        fun next(type: String, after: () -> Unit) {
            val params = QueryPurchasesParams.newBuilder().setProductType(type)
            if (type == BillingClient.ProductType.SUBS) params.setIncludeSuspendedSubscriptions(true)
            billing.queryPurchasesAsync(params.build()) { result, purchases ->
                activity.runOnUiThread {
                    if (result.responseCode != BillingClient.BillingResponseCode.OK) done(result, emptyList())
                    else { found.addAll(purchases); after() }
                }
            }
        }
        next(BillingClient.ProductType.SUBS) {
            next(BillingClient.ProductType.INAPP) {
                done(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.OK).build(), found)
            }
        }
    }

    private fun refreshOnResume() {
        connected { result ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) queryOwned(::emitPurchases)
            else emitPurchases(result, emptyList())
        }
    }

    @Command
    fun queryPurchases(invoke: Invoke) {
        connected { result ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) failure(invoke, result)
            else queryOwned { queryResult, purchases ->
                if (queryResult.responseCode != BillingClient.BillingResponseCode.OK) failure(invoke, queryResult)
                else invoke.resolve(JSObject().put("purchases", JSONArray(purchases.map(::purchaseJson))) as JSObject)
            }
        }
    }

    private fun queryDetails(offers: List<JSONObject>, done: (BillingResult, List<ProductDetails>) -> Unit) {
        val groups = offers.groupBy {
            if (it.getString("plan") == "lifetime") BillingClient.ProductType.INAPP else BillingClient.ProductType.SUBS
        }.entries.toList()
        val found = mutableListOf<ProductDetails>()
        fun queryGroup(index: Int) {
            if (index == groups.size) {
                done(BillingResult.newBuilder().setResponseCode(BillingClient.BillingResponseCode.OK).build(), found)
                return
            }
            val group = groups[index]
            val products = group.value.distinctBy { it.getString("productId") }.map { offer ->
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(offer.getString("productId")).setProductType(group.key).build()
            }
            billing.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(products).build()) { result, details ->
                activity.runOnUiThread {
                    if (result.responseCode != BillingClient.BillingResponseCode.OK) done(result, emptyList())
                    else { found.addAll(details.productDetailsList); queryGroup(index + 1) }
                }
            }
        }
        queryGroup(0)
    }

    /** Only the configured base plan, with no introductory or promotional offer, is sold. */
    private fun describe(offer: JSONObject, product: ProductDetails): JSONObject? {
        val row = JSONObject(offer.toString()).put("provider", "google_play")
        if (offer.getString("plan") == "lifetime") {
            val eligible = product.oneTimePurchaseOfferDetailsList.orEmpty().filter {
                it.rentalDetails == null && it.preorderDetails == null && it.offerId == null
            }
            // Multiple purchase options must be explicitly configured rather than guessed.
            val optionId = offer.optString("purchaseOptionId")
            val option = if (optionId.isNotEmpty()) eligible.singleOrNull { it.purchaseOptionId == optionId } else eligible.singleOrNull()
            if (option == null) return null
            row.put("offerToken", option.offerToken)
            row.put("formattedPrice", option.formattedPrice)
            row.put("currency", option.priceCurrencyCode)
            row.put("priceAmountMicros", option.priceAmountMicros)
            row.put("billingPeriod", JSONObject.NULL)
        } else {
            val sub = product.subscriptionOfferDetails.orEmpty().singleOrNull {
                it.basePlanId == offer.getString("basePlanId") && it.offerId == null
            } ?: return null
            val phase = sub.pricingPhases.pricingPhaseList.singleOrNull() ?: return null
            val period = when (offer.getString("plan")) {
                "monthly" -> "P1M"
                "six_month" -> "P6M"
                "annual" -> "P1Y"
                else -> return null
            }
            if (phase.billingPeriod != period || phase.recurrenceMode != ProductDetails.RecurrenceMode.INFINITE_RECURRING) return null
            row.put("offerToken", sub.offerToken)
            row.put("formattedPrice", phase.formattedPrice)
            row.put("currency", phase.priceCurrencyCode)
            row.put("priceAmountMicros", phase.priceAmountMicros)
            row.put("billingPeriod", phase.billingPeriod)
        }
        return row
    }

    @Command
    fun queryProducts(invoke: Invoke) {
        val input = try { invoke.getArgs().getJSONArray("offers") } catch (_: Exception) {
            invoke.reject("A configured Play catalog is required.", "PLAY_CATALOG_REQUIRED"); return
        }
        if (input.length() !in 1..4) { invoke.reject("Invalid Play catalog.", "PLAY_CATALOG_INVALID"); return }
        val offers = try { (0 until input.length()).map { input.getJSONObject(it).also { row ->
            require(row.getString("productId").isNotBlank())
            require(row.getString("plan") in listOf("monthly", "six_month", "annual", "lifetime"))
            if (row.getString("plan") != "lifetime") require(row.getString("basePlanId").isNotBlank())
        } } } catch (_: Exception) { invoke.reject("Invalid Play catalog.", "PLAY_CATALOG_INVALID"); return }
        connected { result ->
            if (result.responseCode != BillingClient.BillingResponseCode.OK) failure(invoke, result)
            else queryDetails(offers) { detailResult, products ->
                if (detailResult.responseCode != BillingClient.BillingResponseCode.OK) failure(invoke, detailResult)
                else {
                    val rows = offers.mapNotNull { offer ->
                        products.find { it.productId == offer.getString("productId") }?.let { describe(offer, it) }
                    }
                    if (rows.size != offers.size) invoke.reject("Some configured plans are not available from Google Play for this account. Retry after checking the Play account.", "PLAY_PRODUCTS_UNAVAILABLE")
                    else invoke.resolve(JSObject().put("offers", JSONArray(rows)) as JSObject)
                }
            }
        }
    }

    @Command
    fun purchase(invoke: Invoke) {
        val args = invoke.getArgs()
        val offer: JSONObject
        val account: String
        try {
            offer = args.getJSONObject("offer")
            account = args.getString("obfuscatedAccountId")
            require(account.matches(Regex("[a-f0-9]{64}")))
            require(offer.getString("offerToken").isNotBlank())
            require(offer.getString("productId").isNotBlank())
            require(offer.getString("plan") in listOf("monthly", "six_month", "annual", "lifetime"))
            require(offer.getString("formattedPrice").isNotBlank())
            require(offer.getString("currency").isNotBlank())
            if (offer.getString("plan") != "lifetime") require(offer.getString("basePlanId").isNotBlank())
        } catch (_: Exception) { invoke.reject("Sign in and refresh the Play catalog before purchasing.", "PLAY_PURCHASE_INVALID"); return }
        activity.runOnUiThread {
            if (purchaseOpening) { invoke.reject("A Google Play purchase is already in progress.", "PLAY_PURCHASE_IN_PROGRESS"); return@runOnUiThread }
            purchaseOpening = true
            connected { result ->
                if (result.responseCode != BillingClient.BillingResponseCode.OK) { purchaseOpening = false; failure(invoke, result) }
                else queryOwned { ownedResult, owned ->
                    if (ownedResult.responseCode != BillingClient.BillingResponseCode.OK) { purchaseOpening = false; failure(invoke, ownedResult) }
                    else if (owned.any { it.purchaseState == Purchase.PurchaseState.PENDING }) {
                        purchaseOpening = false
                        emitPurchases(ownedResult, owned)
                        invoke.reject("A Google Play payment is pending. Check its status before starting another purchase.", "PLAY_EXISTING_PURCHASE")
                    } else queryDetails(listOf(offer)) { detailsResult, products ->
                        val product = products.singleOrNull()
                        val fresh = product?.let { describe(offer, it) }
                        if (detailsResult.responseCode != BillingClient.BillingResponseCode.OK) { purchaseOpening = false; failure(invoke, detailsResult) }
                        else if (fresh == null || fresh.getString("offerToken") != offer.getString("offerToken") ||
                            fresh.getString("formattedPrice") != offer.optString("formattedPrice") ||
                            fresh.getString("currency") != offer.optString("currency")) {
                            purchaseOpening = false
                            invoke.reject("The Play offer changed. Refresh the plan before purchasing.", "PLAY_OFFER_CHANGED")
                        } else {
                            val params = BillingFlowParams.ProductDetailsParams.newBuilder()
                                .setProductDetails(product!!).setOfferToken(fresh.getString("offerToken")).build()
                            val launch = billing.launchBillingFlow(activity, BillingFlowParams.newBuilder()
                                .setProductDetailsParamsList(listOf(params)).setObfuscatedAccountId(account).build())
                            if (launch.responseCode == BillingClient.BillingResponseCode.OK) {
                                invoke.resolve(JSObject().put("status", "opening") as JSObject)
                            } else { purchaseOpening = false; failure(invoke, launch) }
                        }
                    }
                }
            }
        }
    }
}
