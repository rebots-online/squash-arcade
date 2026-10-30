import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { accountAuth, observeIdentity, googleSignIn, emailSignIn, emailCreate, emailReset, acceptDeviceToken, accountSignOut } from './firebase.js';
import { accountRequest } from './api.js';
import { AccountView } from './AccountView.js';
import { isNativeAndroid, queryPlayProducts, queryPlayPurchases, purchasePlayOffer, listenPlayPurchases } from './native-billing.js';

export class AccountController {
  constructor(engine) {
    this.engine = engine;
    this.state = { native:isTauri(),android:false,user:null,account:null,offers:[],catalogLoading:true,busy:false,error:'',message:'',nativePending:false,checkoutPending:false };
    this.plan = null;
    this.view = new AccountView(this);
    this.ready = this.initialize();
    window.addEventListener('focus', () => { if(this.state.user && !this.state.busy)this.run(()=>this.restore(),false); });
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&this.state.user&&!this.state.busy)this.run(()=>this.restore(),false);});
  }
  get isOpen() { return this.view.dialog.open; }
  async initialize() {
    try {
      this.state.android = await isNativeAndroid();
      if (this.state.android) this.unsubscribePlay = await listenPlayPurchases(event => {
        if(event.status==='canceled'){this.state.busy=false;this.state.checkoutPending=false;this.state.message='Purchase canceled.';this.render();return;}
        if(event.status==='error'){this.state.busy=false;this.state.error='Google Play could not complete this request. Restore purchases to check its status.';this.render();return;}
        this.run(async()=>{await this.verifyNative(event.purchases||[]);await this.refresh();});
      });
      observeIdentity(user => {
        this.identityGeneration = (this.identityGeneration || 0)+1;
        this.state.user=user;this.state.account=null;this.state.nativePending=false;this.state.checkoutPending=false;
        this.render();
        if(user)this.run(()=>this.restore(),false);
      });
      await this.catalog();
    } catch(error) { this.state.error=error.message;this.state.catalogLoading=false;this.render(); }
  }
  render() { this.view.render();this.engine.courtHUD?.updateAccess?.(); }
  open(tab='Purchase') {
    this.invoker=document.activeElement;
    this.engine.arcadeBriefing?.close();
    this.view.open(tab);this.engine._syncModalPauseState();
  }
  closed() { this.deviceCanceled=true;this.admissionGeneration=(this.admissionGeneration||0)+1;this.engine._syncModalPauseState();this.invoker?.focus?.(); }
  async run(action,busy=true) {
    if(busy&&this.state.busy)return;
    if(busy)this.state.busy=true;
    this.state.error='';this.render();
    try { return await action(); } catch(error){this.state.error=error.message||'This request could not be completed. Retry.';}
    finally{if(busy)this.state.busy=false;this.render();}
  }
  async catalog() {
    this.state.catalogLoading=true;this.render();
    try {
      const result=await accountRequest(`/catalog?platform=${this.state.android?'android':'web'}`,{anonymous:true});
      this.state.offers=this.state.android?await queryPlayProducts(result.offers):result.offers;
      this.state.playListingUrl=result.playListingUrl;
      if(!this.state.offers.some(o=>o.plan===this.plan))this.plan=this.state.offers[0]?.plan||null;
    } finally{this.state.catalogLoading=false;this.render();}
  }
  async refresh() {
    if(!this.state.user)return;
    const uid=this.state.user.uid,generation=this.identityGeneration;
    const account=await accountRequest('/account');
    if(uid!==this.state.user?.uid||generation!==this.identityGeneration)return;
    this.state.account=account;
    if(account.access?.state!=='pending'&&!account.billing?.pendingCheckout)this.state.checkoutPending=false;
    this.render();return account;
  }
  async verifyNative(purchases) {
    this.state.nativePending=purchases.some(p=>p.state==='pending');
    if(!this.state.user)return;
    const configured=new Set(this.state.offers.map(o=>o.productId));
    if(purchases.some(p=>p.state==='purchased')&&!configured.size){await this.catalog();for(const o of this.state.offers)configured.add(o.productId);}
    for(const p of purchases)if(p.state==='purchased')for(const productId of p.products)if(configured.has(productId))await accountRequest('/play/verify',{method:'POST',body:{purchaseToken:p.purchaseToken,productId}});
  }
  async restore() {
    if(!this.state.user)return;
    const uid=this.state.user.uid,generation=this.identityGeneration;
    if(this.state.android)await this.verifyNative(await queryPlayPurchases());
    const account=await accountRequest('/restore',{method:'POST',body:{}});
    if(uid!==this.state.user?.uid||generation!==this.identityGeneration)return;
    this.state.account=account;
    if(account.access?.state!=='pending'&&!account.billing?.pendingCheckout)this.state.checkoutPending=false;
    if(account.billing?.reconciliationIncomplete)this.state.message='Some purchase records could not be refreshed. Verified access remains available; restore again to check the remaining records.';
    this.render();
  }
  restoreAction() { if(!this.state.user){this.open('Account');return;}return this.run(()=>this.restore()); }
  retry() { return this.run(async()=>{await this.catalog();if(this.state.user)await this.restore();}); }
  hasAccess() {
    const a=this.state.account?.access;
    return Boolean(a&&['active','grace','canceled_active'].includes(a.state)&&(a.lifetime||Date.parse(a.validUntil)>Date.now()));
  }
  async admitMatch() {
    if(this.admitting)return false;
    this.admitting=true;
    this.state.message='Checking access for your next match…';
    this.open('Purchase');
    const intentGeneration=this.admissionGeneration||0;
    try {
      await this.ready;
      if(intentGeneration!==(this.admissionGeneration||0)||!this.isOpen)return false;
      if(!this.state.user){this.open('Purchase');return false;}
      const generation=this.identityGeneration;
      const result=await accountRequest('/match-access',{method:'POST',body:{}});
      if(generation!==this.identityGeneration||intentGeneration!==(this.admissionGeneration||0)||!this.isOpen)return false;
      if(this.state.account)this.state.account.access=result.access;
      this.render();
      if(!result.allowed){this.open('Purchase');return false;}
      this.state.message='';
      if(this.isOpen)this.view.dialog.close();
      return true;
    }catch(error){this.state.error=error.message;if(intentGeneration===(this.admissionGeneration||0)&&this.isOpen)this.open('Account');return false;}
    finally{this.admitting=false;}
  }
  authenticate(kind,email,password) {
    return this.run(async()=>{
      if(kind==='reset'){await emailReset(email);this.state.message='Password reset email requested. Check your inbox.';return;}
      if(kind==='google')await googleSignIn();
      else if(kind==='create')await emailCreate(email,password);
      else await emailSignIn(email,password);
      this.state.message='Signed in. Checking your access…';
      await this.refresh();
    });
  }
  signIn() {
    if(!this.state.native){this.open('Account');return;}
    return this.run(async()=>{
      this.deviceCanceled=false;
      const flow=await accountRequest('/device/start',{method:'POST',body:{},anonymous:true});
      this.state.message='Complete sign-in in your browser, then return here.';this.render();
      await this.openExternal(flow.url);
      const deadline=Date.parse(flow.expiresAt);
      while(Date.now()<deadline){
        if(this.deviceCanceled){this.state.message='Browser sign-in canceled in this game.';return;}
        await new Promise(resolve=>setTimeout(resolve,2000));
        const result=await accountRequest('/device/exchange',{method:'POST',body:{id:flow.id,secret:flow.secret},anonymous:true});
        if(this.deviceCanceled)return;
        if(result.status==='approved'){await acceptDeviceToken(result.customToken);this.state.message='Signed in. Checking access…';await this.refresh();return;}
      }
      throw new Error('Browser sign-in expired. Start sign-in again.');
    });
  }
  async openExternal(url) {
    const parsed=new URL(url);
    if(parsed.protocol!=='https:')throw new Error('The provider did not return a secure page. Retry.');
    if(this.state.native)await openUrl(parsed.href);
    else window.location.assign(parsed.href);
  }
  buy() {
    if(!this.state.user){this.open('Account');return;}
    return this.run(async()=>{
      await this.restore();
      if(this.hasAccess()||this.state.nativePending||this.state.account?.access?.state==='pending'||this.state.account?.billing?.pendingCheckout){this.state.message='Your existing purchase has been refreshed.';return;}
      const offer=this.state.offers.find(o=>o.plan===this.plan);
      if(!offer?.formattedPrice)throw new Error('Select a purchase option with a current provider price.');
      if(this.state.android){
        const accountId=this.state.account?.billing?.playObfuscatedAccountId;
        if(!accountId)throw new Error('Your Google Play account binding could not be loaded. Refresh your account.');
        this.state.checkoutPending=true;
        try {await purchasePlayOffer(offer,accountId);}catch(error){this.state.checkoutPending=false;throw error;}
      }else{
        this.checkoutRequestId ||= crypto.randomUUID();
        this.state.checkoutPending=true;
        const result=await accountRequest('/checkout',{method:'POST',body:{plan:this.plan,requestId:this.checkoutRequestId}});
        await this.refresh();
        if(result.url)await this.openExternal(result.url);
        else this.state.message='Checking your existing access. Refresh your account.';
      }
    });
  }
  async manage() { if(this.state.account?.billing?.manageUrl){await this.openExternal(this.state.account.billing.manageUrl);return;}const result=await accountRequest('/portal',{method:'POST',body:{}});await this.openExternal(result.url); }
  async document(id) { const result=await accountRequest(`/purchases/${encodeURIComponent(id)}/document`);await this.openExternal(result.url); }
  signOut() { return this.run(async()=>{await accountSignOut();this.state.account=null;this.state.user=null;this.state.message='Signed out.';}); }
}
