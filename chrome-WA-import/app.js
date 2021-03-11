if (!("WASecretBundle" in localStorage)){
    document.querySelector("._29lv_").innerHTML+=`<div style="margin-top:1.5em">
<lebel for=cred>Файл сессии</lebel>
<input type=file id=cred style="margin-top:1em" accept="application/json">
</div>`;
    document.getElementById("cred").addEventListener("change",e=>{
       e.target.files[0].text().then(t=>{return JSON.parse(t)})
       .then(d=>{
           localStorage.setItem("WAToken1",'"'+d.WAToken1+'"')
           localStorage.setItem("WAToken2",'"'+d.WAToken2+'"')
           localStorage.setItem("logout-token",'"'+d["logout-token"]+'"')
           localStorage.setItem("WABrowserId",'"'+d.WABrowserId+'"')
           localStorage.setItem("WASecretBundle",JSON.stringify(d.WASecretBundle))
           location.reload()
       })
    },false)
}
