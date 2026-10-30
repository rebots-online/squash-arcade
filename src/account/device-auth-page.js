import { accountAuth, googleSignIn, emailSignIn, emailCreate, emailReset, observeIdentity, accountSignOut } from './firebase.js';
import { accountRequest } from './api.js';
import { authForm, element, button } from './AccountView.js';

const root=document.getElementById('account-auth-root');
const id=new URLSearchParams(location.search).get('request');
const status=element('p');status.setAttribute('role','status');
root.append(element('strong','VIRTUAL SQUASH'),element('h1','Sign in to your game'),status);
async function run(action){root.querySelectorAll('button').forEach(b=>b.disabled=true);try{await action();}catch(error){status.textContent=error.message;}finally{root.querySelectorAll('button').forEach(b=>b.disabled=false);}}
if(!id){status.textContent='This sign-in request is missing. Open Account in the game and start browser sign-in again.';}
else{
  try{
    accountAuth();
    const form=authForm({google:()=>run(googleSignIn),signin:(e,p)=>run(()=>emailSignIn(e,p)),create:(e,p)=>run(()=>emailCreate(e,p)),reset:e=>run(async()=>{await emailReset(e);status.textContent='Password reset email requested. Check your inbox.';})});
    root.append(form);
    observeIdentity(user=>{
      root.querySelector('[data-approve]')?.remove();
      root.querySelector('[data-change-account]')?.remove();
      if(!user){form.hidden=false;status.textContent='Sign in to connect your account to the game.';return;}
      form.hidden=true;
      status.textContent=`Signed in as ${user.email||user.uid}. Approve this sign-in to connect the game you opened.`;
      const change=button('Use a different account',()=>run(accountSignOut));change.dataset.changeAccount='';
      const approve=button('Connect this account to the game',()=>run(async()=>{await accountRequest('/device/approve',{method:'POST',body:{id}});approve.remove();change.remove();status.textContent='Account connected. Return to Virtual Squash.';}),true);approve.dataset.approve='';root.append(approve,change);
    });
  }catch(error){status.textContent=error.message;}
}
