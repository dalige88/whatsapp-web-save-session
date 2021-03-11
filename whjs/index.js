const CLI = require('clui');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const crypto = require('crypto');
const HKDF = require('futoin-hkdf');
const Curve = require('curve25519-js')
var Table = require('cli-table3');
const WebSocket = require('ws');
const fs = require('fs');
const mcc_mnc_list = require('mcc-mnc-list');



const rndClID = (Buffer.from(""+Math.floor(Math.random() * 10**12))).toString('base64')
const WPwebVersion = "[2,2106,5]"


let LOGINCRED = {
    clientId: rndClID,
}
let CONECTRED = {}
let ADDINFORM = {}
let OperationNow=""

clear();
console.log(
  chalk.yellow(
    figlet.textSync('Whatsapp web', { horizontalLayout: 'full', })
  )
);


let status = new CLI.Spinner('Ожидание соединения...      ', ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷']);
status.start();

const wss = new WebSocket.Server({ port: 8080,host:"0.0.0.0" });
wss.on("connection",(s)=>{
    s.send("work")
    GETQRDATA()
})
function sendQRdata(data){
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
}

function GETQRDATA(){
    let ws = new WebSocket('wss://web.whatsapp.com/ws',{
    headers: { 'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36" },
    origin:"https://web.whatsapp.com"
});

function SendformatedMess(num,data){
    //1615299749.--2,["admin","Conn","reref"]
    let now = parseInt(Date.now()/1000)
    
    ws.send(now+'.--'+num+','+data)
}

ws.on('open', ()=> {
    status.message("Инициализация...      ")
    let now = parseInt(Date.now()/1000)
    
    ws.send(now+'.--0,["admin","init",'+WPwebVersion+',["Windows","Chrome","10"],"'+rndClID+'",true]')
    OperationNow="login"
  });


let intervalReqLogin = null;
ws.on('close', ()=> {
    clearInterval(intervalReqLogin)
    intervalReqLogin = null
  });
ws.on("message", (data)=>{
    status.message("Получение данных...      ")
    isdText = (typeof data === "string")
    
    switch (!0) {
        case isdText && /\d+\.--/.test(data.split(",",1)):
            let APInN = data.split(",",1)[0].split(".")[1].split("-")[2];
            jdata = JSON.parse(data.split(",").slice(1).join(","))
            if (jdata.status != 200){
                ws.close()
                GETQRDATA()
                return
            }
            switch (OperationNow) {
                case "login":
                  status.message("Ожидание сканирования...      ")
                  LOGINCRED["serverRef"] = jdata["ref"];
            
                  LOGINCRED["curveKeys"] = Curve.generateKeyPair(crypto.randomBytes(32))
                  const publicKey = Buffer.from(LOGINCRED["curveKeys"].public).toString('base64')

                  
                  //const { public, private } = generateKeyPair(new Uint8Array(crypto.randomBytes(32)))
                  
                  qrCodeContents = LOGINCRED["serverRef"] + "," + publicKey + "," + LOGINCRED["clientId"];
                  sendQRdata(qrCodeContents)
                  if(!intervalReqLogin){
                      intervalReqLogin =  setInterval(()=>{sendIntervalLoginReq(data.split(",")[0].split("-").pop())}, 20000);
                  }
                  break;
            
                default:
                    break;
            }

        break;
        case isdText && /s1,/.test(data):
            clearInterval(intervalReqLogin)
            status.message("Авторизация...      ")
            jdata = JSON.parse(data.split(",").slice(1).join(","))
            CONECTRED["clientToken"] = jdata[1]["clientToken"];
            CONECTRED["serverToken"] = jdata[1]["serverToken"];
            CONECTRED["browserToken"]= jdata[1]["browserToken"];
            CONECTRED["me"] =          jdata[1]["wid"].split("@")[0];
            CONECTRED["secret"]=Buffer.from(jdata[1]["secret"],"base64")

            CONECTRED["sharedKey"] = Curve.sharedKey(LOGINCRED["curveKeys"].private, CONECTRED["secret"].slice(0, 32))
            
           
            CONECTRED["sharedSecretExpanded"] = hkdf(CONECTRED["sharedKey"], 80)

            // perform HMAC validation.
        const hmacValidationKey = CONECTRED["sharedSecretExpanded"].slice(32, 64)
        const hmacValidationMessage = Buffer.concat([CONECTRED["secret"].slice(0, 32), CONECTRED["secret"].slice(64, CONECTRED["secret"].length)])
          
        const hmac = crypto.createHmac('sha256', hmacValidationKey).update(hmacValidationMessage).digest()

        if (!hmac.equals(CONECTRED["secret"].slice(32, 64))) {
            // if the checksums didn't match
            throw new BaileysError ('HMAC validation failed')
        }

        const encryptedAESKeys = Buffer.concat([
            CONECTRED["sharedSecretExpanded"].slice(64, CONECTRED["sharedSecretExpanded"].length),
            CONECTRED["secret"].slice(64, CONECTRED["secret"].length),
        ])

        const decryptedKeys = aesDecrypt(encryptedAESKeys, CONECTRED["sharedSecretExpanded"].slice(0, 32))
        
        const encKey = decryptedKeys.slice(0, 32).toString("base64")
        const macKey = decryptedKeys.slice(32, 64).toString("base64")

        
        ws.close()
        wss.close()
        status.stop()

        fs.writeFileSync('./Whatsapp_'+CONECTRED["me"]+".json", JSON.stringify(
            {
                WAToken1: CONECTRED.clientToken,
                WAToken2: CONECTRED.serverToken,
                "logout-token" : CONECTRED.browserToken,
                WABrowserId : LOGINCRED.clientId,
                WASecretBundle: {
                    encKey,macKey
                }
            }
        ));

        var table = new Table({
            chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
                   , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
                   , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
                   , 'right': '║' , 'right-mid': '╢' , 'middle': '│' },
            colAligns:"center",
                        
          });
          debugger
            phoneLoc = mcc_mnc_list.filter({ mccmnc:  [jdata[1]["phone"]["mcc"], jdata[1]["phone"]["mnc"].replace(/^(0{2,})/,"0")].join("") })[0]
          table.push(
        [
            {content:'Аккаунт', hAlign:"center"},
            {colSpan:2,content:'+'+CONECTRED["me"], hAlign:"center"}
        ], 
        [
            '🧑 '+jdata[1]["pushname"], 
            '📱 '+jdata[1]["phone"]["device_manufacturer"], 
            '📲 '+jdata[1]["platform"]+" "+jdata[1]["phone"]["os_version"]],
        [
            {colSpan:3,content:'Местоположение', hAlign:"center"}
        ],
        [
            "🌍 "+phoneLoc["countryName"],
            "📻 "+phoneLoc["brand"],
               ""+phoneLoc["operator"]
        ],
        [
            {content:"Дополнительная информация", colSpan: 3, hAlign:"center"}
        ],
        [
            "💬 Язык",
            "🖥️  Модель устройства",
            "🔋 Заряд батареи"
        ],
        [
            {content:jdata[1]["locales"],hAlign:"center"},
            {content:jdata[1]["phone"]["device_model"],hAlign:"center"},
            {content:jdata[1]["battery"]+" %",hAlign:"center"}
        ]
        );
        clear(!0);
        console.log(table.toString())
        process.exit(0)

            // keysDecrypted = AESDecrypt(CONECTRED["sharedSecretExpanded"].slice(32), keysEncrypted);
            // self.loginInfo["key"]["encKey"] = keysDecrypted[:32];
            // self.loginInfo["key"]["macKey"] = keysDecrypted[32:64];
            /*
                    WAToken1 - CONECTRED.clientToken
                    WAToken2 - CONECTRED.serverToken
                    logout-token - CONECTRED.browserToken
                    WABrowserId - clientId
                    WASecretBundle - {
                        "encKey":"woQj8REvTycvJ90l5TRHNGi5pxdWxg0ZrpckWfpUYss=",
                        "macKey":"ucXau3oD7nqb84qDLX1+UY3Kuw0Kk2qjpTkKX7Fd6w0="
                    }


            */

        break;
    
    }
    
})

function sendIntervalLoginReq(NNext){
    SendformatedMess(1+(1*NNext),'["admin","Conn","reref"]')
}

}

function hkdf(buffer, expandedLength, info = null) {
    return HKDF(buffer, expandedLength, { salt: Buffer.alloc(32), info: info, hash: 'SHA-256' })
}
 function aesDecrypt(buffer, key) {
    return aesDecryptWithIV(buffer.slice(16, buffer.length), key, buffer.slice(0, 16))
}
/** decrypt AES 256 CBC */
 function aesDecryptWithIV(buffer, key, IV) {
    const aes = crypto.createDecipheriv('aes-256-cbc', key, IV)
    return Buffer.concat([aes.update(buffer), aes.final()])
}



  
  







