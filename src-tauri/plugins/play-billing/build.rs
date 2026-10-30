fn main() {
    tauri_plugin::Builder::new(&[
        "platform",
        "queryProducts",
        "queryPurchases",
        "purchase",
        "registerListener",
        "removeListener",
    ])
    .android_path("android")
    .build();
}
