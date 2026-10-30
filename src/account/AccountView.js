import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';

export const PLAN_NAMES = { monthly: 'Monthly', six_month: '6 months', annual: 'Annual', lifetime: 'Lifetime' };
export function element(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
export function button(text, action, primary = false) {
  const b = element('button', text, primary ? 'account-button account-primary' : 'account-button');
  b.type = 'button';
  b.onclick = action;
  return b;
}
export function authForm(actions) {
  const form = element('form', undefined, 'account-auth-form');
  const email = element('input'); email.name = 'email'; email.type = 'email'; email.autocomplete = 'email'; email.required = true;
  const password = element('input'); password.name = 'password'; password.type = 'password'; password.autocomplete = 'current-password';
  for (const [label, input] of [['Email', email], ['Password', password]]) {
    const field = element('label', label); field.append(input); form.append(field);
  }
  const submit = button('Sign in', null, true); submit.type = 'submit';
  form.onsubmit = e => { e.preventDefault(); if (form.reportValidity()) actions.signin(email.value, password.value); };
  form.append(submit, button('Create account', () => { if (form.reportValidity()) actions.create(email.value, password.value); }), button('Reset password', () => { if (email.reportValidity()) actions.reset(email.value); }));
  const google = button('', actions.google); google.className = 'account-google'; google.setAttribute('aria-label', 'Sign in with Google');
  const image = element('img'); image.src = '/assets/google-sign-in.png'; image.alt = 'Sign in with Google'; image.width = 189; image.height = 44; google.append(image);
  form.append(element('p', 'Google sign-in is also available.'), google);
  return form;
}

export class AccountView {
  constructor(controller) {
    this.controller = controller;
    this.tab = 'Purchase';
    this.dialog = element('dialog', undefined, 'account-dialog'); this.dialog.id = 'account-dialog'; this.dialog.setAttribute('aria-label', 'Virtual Squash account and purchases');
    this.dialog.addEventListener('close', () => controller.closed());
    for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click']) this.dialog.addEventListener(type, e => e.stopPropagation());
    document.body.append(this.dialog);
  }
  open(tab = 'Purchase') { this.tab = tab; this.render(); if (!this.dialog.open) this.dialog.showModal(); this.dialog.querySelector('button')?.focus(); }
  render() {
    const c = this.controller, state = c.state;
    const focused = document.activeElement;
    const focusedName=this.dialog.contains(focused)?focused.getAttribute('name'):null;
    const focusedLabel=this.dialog.contains(focused)&&focused.matches('button')?focused.textContent:null;
    const values=Object.fromEntries([...this.dialog.querySelectorAll('.account-auth-form input')].map(input=>[input.name,input.value]));
    this.dialog.replaceChildren();
    const header = element('header'); header.append(element('strong', 'VIRTUAL SQUASH'), button('Close', () => this.dialog.close()));
    const nav = element('nav'); nav.setAttribute('aria-label', 'Account sections');
    for (const tab of ['Purchase', 'Account', 'Receipts']) { const b = button(tab, () => { this.tab = tab; this.render(); }); b.setAttribute('aria-current', this.tab === tab ? 'page' : 'false'); nav.append(b); }
    const content = element('section', undefined, 'account-content');
    this.dialog.append(header, nav, content);
    if (state.message) { const status = element('p', state.message, 'account-status'); status.setAttribute('role', 'status'); content.append(status); }
    if (state.error) { const error = element('p', state.error, 'account-error'); error.setAttribute('role', 'alert'); content.append(error, button('Retry', () => c.retry())); }
    if (this.tab === 'Purchase') this.purchase(content);
    else if (this.tab === 'Account') this.account(content);
    else this.receipts(content);
    if (state.busy) { this.dialog.setAttribute('aria-busy', 'true'); content.querySelectorAll('button,input').forEach(b => { b.disabled = true; }); }
    else this.dialog.removeAttribute('aria-busy');
    for(const input of this.dialog.querySelectorAll('.account-auth-form input'))if(Object.hasOwn(values,input.name))input.value=values[input.name];
    const target=focusedName?[...this.dialog.querySelectorAll('input')].find(input=>input.name===focusedName):focusedLabel?[...this.dialog.querySelectorAll('button')].find(b=>b.textContent===focusedLabel):null;
    target?.focus({preventScroll:true});
  }
  purchase(content) {
    const c = this.controller, s = c.state;
    content.append(element('h1', 'Your next match starts here'), element('p', 'One account. Full match access across your devices.'));
    if (c.hasAccess()) { content.append(element('p', 'Your match access is ready.'), button('View account', () => this.open('Account'), true)); }
    else if (s.account?.billing?.pendingCheckout) {
      content.append(element('p', 'Your checkout is in progress. Check its status before starting another purchase.'));
      const pending = s.account.billing.pendingCheckout;
      if (pending.url) content.append(button('Resume checkout', () => c.run(() => c.openExternal(pending.url)), true));
      else if(pending.state==='creating')content.append(button('Resume checkout',()=>c.resumeCheckout(),true));
      content.append(button('Check status', () => c.run(() => c.restore())));
    } else if (s.account?.access?.state === 'pending' || s.nativePending || s.checkoutPending) {
      content.append(element('p', 'Your payment is pending verification. You do not need to pay again.'), button('Check status', () => c.run(() => c.restore())));
    } else {
      const choices = element('fieldset'); choices.append(element('legend', 'Choose your access'));
      if (s.catalogLoading) content.append(element('p', 'Loading purchase options…'));
      for (const offer of s.offers) {
        if (!offer.formattedPrice) continue;
        const label = element('label', undefined, 'account-offer');
        const input = element('input'); input.type = 'radio'; input.name = 'access-plan'; input.value = offer.plan; input.checked = c.plan === offer.plan;
        input.onchange = () => { c.plan = offer.plan; this.render(); };
        label.append(input, element('strong', PLAN_NAMES[offer.plan] || offer.plan), element('span', offer.formattedPrice), element('small', offer.plan === 'lifetime' ? 'One-time purchase' : `Renews ${offer.plan === 'monthly' ? 'monthly' : offer.plan === 'six_month' ? 'every 6 months' : 'annually'}`)); choices.append(label);
      }
      content.append(choices);
      const purchase = button(s.user ? (s.android ? 'Continue with Google Play' : 'Continue to checkout') : 'Sign in to purchase', () => c.buy(), true);
      purchase.disabled = !s.offers.some(o => o.plan === c.plan && o.formattedPrice) || (s.user && (!s.account || s.account.access?.state === 'error'));
      content.append(purchase);
      if (!s.catalogLoading && !s.offers.length) content.append(element('p', 'Purchase options could not be loaded.'), button('Reload purchase options', () => c.run(() => c.catalog())));
    }
    content.append(button('Restore purchases', () => c.restoreAction()));
    if (!s.android) {
      const info = element('details'); info.append(element('summary', 'Use Google Play balance'));
      info.append(element('p', 'Redeem your Google Play gift card in Google Play, then purchase in the Android app using this same account. Return here and restore purchases. Google Play balance cannot be used at Stripe checkout.'));
      if (s.playListingUrl) info.append(button('Open Android app listing', () => c.run(() => c.openExternal(s.playListingUrl))));
      content.append(info);
    }
  }
  account(content) {
    const c = this.controller, s = c.state;
    content.append(element('h1', 'Your game. Your account.'));
    if (!s.user) {
      content.append(element('p', 'Sign in to keep your access with you.'));
      if (s.native) content.append(button('Sign in in your browser', () => c.signIn(), true));
      else content.append(authForm({ signin:(e,p)=>c.authenticate('signin',e,p),create:(e,p)=>c.authenticate('create',e,p),reset:e=>c.authenticate('reset',e),google:()=>c.authenticate('google') }));
      content.append(element('p', 'Use the same account on Android, desktop and the web. Your purchases and receipts appear here after you sign in.'), button('Already purchased? Restore purchases', () => c.restoreAction()), element('p', 'Watch the court and view the instructions without signing in.'));
      return;
    }
    content.append(element('p', s.account?.profile?.email || s.user.email || s.user.uid));
    const a = s.account?.access;
    const labels = { none:'No match access',pending:'Payment pending',active:'Access active',grace:'Access active — payment needs attention',canceled_active:'Renewal canceled — access remains active',expired:'Access expired',revoked:'Access revoked',checking:'Checking access',error:'Access could not be checked' };
    content.append(element('h2', a?.lifetime && c.hasAccess() ? 'Lifetime access' : labels[a?.state] || 'Checking access'));
    if (a?.plan) content.append(element('p', PLAN_NAMES[a.plan] || a.plan));
    if (a?.provider) content.append(element('p', `Purchased through ${a.provider === 'google_play' ? 'Google Play' : 'Stripe'}`));
    if (a?.validUntil && !a.lifetime) content.append(element('p', `Access until ${new Date(a.validUntil).toLocaleString()}`));
    content.append(button('Refresh access', () => c.run(() => c.refresh())), button('Restore purchases', () => c.restoreAction()));
    if (a?.provider && !a.lifetime && a.state !== 'none') {
      content.append(button('Manage subscription', () => c.run(() => c.manage())));
      if(['active','grace'].includes(a.state))content.append(button('Cancel renewal',()=>c.run(()=>c.manage())),element('p',a.validUntil?`Cancel at your payment provider. Your paid access remains available until ${new Date(a.validUntil).toLocaleString()}.`:'Review cancellation and your paid-through date at your payment provider.'));
    }
    content.append(button('Receipts', () => this.open('Receipts')), button('Sign out', () => c.signOut()));
  }
  receipts(content) {
    const c = this.controller, s = c.state;
    content.append(element('h1', 'Your receipts'));
    if (!s.user) { content.append(element('p', 'Sign in to view purchases made with your account.'), button('Sign in', () => this.open('Account'), true)); return; }
    if (!s.account) { content.append(element('p', 'Checking your purchases…'),button('Refresh purchases',()=>c.run(()=>c.refresh()))); return; }
    if(s.account.billing?.historyIncomplete){content.append(element('p','Purchase history could not be fully checked.'),button('Retry purchase history',()=>c.run(()=>c.restore())));return;}
    if (!s.account.purchases?.length) { content.append(element('h2', 'No purchases yet'),element('p','Purchases made with this account will appear here. Already bought access on another device? Restore your purchases.'),button('Restore purchases',()=>c.restoreAction(),true),button('Browse access options',()=>this.open('Purchase')));return; }
    for (const p of s.account.purchases) {
      const row = element('article', undefined, 'account-receipt');
      row.append(element('h2',PLAN_NAMES[p.plan]||p.plan),element('p',p.provider==='google_play'?'Google Play':'Stripe'));
      if(p.orderId||p.invoiceId)row.append(element('code',p.orderId||p.invoiceId));
      if(p.status)row.append(element('p',p.status));
      if(p.paidAt)row.append(element('p',new Date(p.paidAt).toLocaleString()));
      if(p.amount != null && p.currency){const formatter=new Intl.NumberFormat(undefined,{style:'currency',currency:p.currency});const digits=formatter.resolvedOptions().maximumFractionDigits;row.append(element('p',formatter.format(p.amount/(10**digits))));}
      if(p.documentAvailable)row.append(button(p.provider==='google_play'?'Open Google Play purchase history':'Get receipt or invoice',()=>c.run(()=>c.document(p.id))));
      content.append(row);
    }
  }
}
