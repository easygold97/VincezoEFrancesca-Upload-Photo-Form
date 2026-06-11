const DROPBOX_TOKEN="sl.u.AGhdyWTlR6g2Yx7xecuOKvycB7JN9p9fYhoCk8fi3yehhZ0u_SaehDIX3R5v_Il-mOctJ2UslqZqE-ZNaGBIbEhqGDGL5QxRQEXCmy4FheLa0UQGxvtgBYi1zHcC6Hz56RZkwoQ7PVDZn19XgcZkSezTheiswa0mCvnWhEBqHPBS5Nsv0SW8e6UPxGvjqxQkto-pi5rSp4ZTfhYQ7PLqtPfj-Z4rB3kAGrimGBmo0aRfQ4VVJEdDnQt-0KXAZba6wfFnyp6SQV4io2H_oNYfZqoyiwMjTv1dED6utwhFlhQBNgG13gqXQXSnXlaEHs_H0TFHmT2TDDkkhmp11rtqiO0cv4cYIhDeVuFBL8sW5bO3gcMD6J8CFqW8bkZe0Rh5-Xz8WcjcO8VXXD3xeUXmlAXrdlWftWLxGq3ZLhVvBU22gQ-gIYdjNyn5TsmRo_0Ca9TJRA8-EiYLKWWhpI68DNNOL4Zb_Hekw3vagMhAr6FXpMvwkrgAgApunPrsUwW7cpulPIyuL48q8srDzBaI7wZl0MdB_A64S3oapOsdmJHHf3hP_MZLvpn3Vz77iUX3xBycj948qpoPkS5QE_UDtzaKyU2BHk0p7okFAv16YTTJWFSGf6qTESE6nv4ss2b7KWqf7FTGJXn3zez4o8tNb3Q8j_Ac9ralcGIUxsauIEoEELzSCuMtsP69J7Rnmv-24zt4xrojZ6434QU3f7QI1NQo4vWNAZO5JVb7zDdtUZo6ErSBRt2TJdb95a56xIGA7AR8c7MLp272I_zturpTnn3PVkxz6smkZuvEy9RxNj6ooKU7x8X65aHKNfK3APkFTiKrTcR5pV6lbXfX_QhtyS3XdYTNan8aG_oPvZdmC_Y8qq1Sd9CGZtZboMWRCqDx_67gHMPgj6-1xmfEp8rMnsVrd_lOLnaC2BxmAAC7imMWi-dAz__GLKiFtvTbCBw-P8QwDMgr4p3uQB9WttDfO7P0OnDCbCB3YZxemlh8CcpfhcMOCP4pXmXiIHBrRErX45PnC1-mbRQGRjuYOYXBvhrjAjKA7YgB9bslU9ZmYMyKxEnmRIYqDNemRtGJCn_pIbgU0LhC8Cqav5Wb1VJQIHr1pWB8sFy8LNrnMCvJgIgl1mzyoSo1UiDa2O9dDjy57NvYwsrF4xitkzdRhyzp-ADouJJPVELzKj1kPKUaVM7T7TcGUb2RQb_fhQwgoVUv4ZHHBupDgcee8vv8blEMHWjp6zYd2JhkOe7EwjjcymJ1fJKwsI1sp9Z3i5Jm8HCQX9XQTm-DQH1O-1XJrfPOMUy-";
const CARTELLA="/FotoMatrimonioVincenzo";

async function uploadFiles(){
 const files=document.getElementById("files").files;
 for(const file of files){
  document.getElementById("status").innerText="Caricamento "+file.name;
  await fetch("https://content.dropboxapi.com/2/files/upload",{method:"POST",headers:{"Authorization":"Bearer "+DROPBOX_TOKEN,"Dropbox-API-Arg":JSON.stringify({path:CARTELLA+"/"+Date.now()+"_"+file.name,mode:"add",autorename:true}),"Content-Type":"application/octet-stream"},body:file});
 }
 document.getElementById("status").innerText="Grazie! Ricordi caricati ❤️";
 caricaUltimi();
}

async function caricaUltimi(){
 const r=await fetch("https://api.dropboxapi.com/2/files/list_folder",{method:"POST",headers:{"Authorization":"Bearer "+DROPBOX_TOKEN,"Content-Type":"application/json"},body:JSON.stringify({path:CARTELLA})});
 const data=await r.json();
 const ultimi=(data.entries||[]).sort((a,b)=>b.client_modified.localeCompare(a.client_modified)).slice(0,5);
 const g=document.getElementById("gallery"); g.innerHTML="";
 for(const f of ultimi){
  const l=await fetch("https://api.dropboxapi.com/2/files/get_temporary_link",{method:"POST",headers:{"Authorization":"Bearer "+DROPBOX_TOKEN,"Content-Type":"application/json"},body:JSON.stringify({path:f.path_lower})});
  const link=(await l.json()).link;
  let e=f.name.match(/mp4|mov/i)?document.createElement("video"):document.createElement("img");
  e.src=link;if(e.tagName==="VIDEO")e.controls=true;g.appendChild(e);
 }
}
caricaUltimi(); setInterval(caricaUltimi,30000);
