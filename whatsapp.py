import requests,random,base64,websocket,time,json
def main():
    s = requests.Session()
    ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.190 Safari/537.36"
    Dheaders = {
        "user-agent": ua,
        "accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6,la;q=0.5",
        "dnt": "1",
        "referer": "https://www.google.com/",

    }
    r = s.get("https://web.whatsapp.com/",headers=Dheaders)
    if r.status_code != 200:
        print("[!] Пожалуйста, попробуйте позже [!]")
        print("-"*67)
        exit(1)

    wheaders={
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,uk;q=0.6,la;q=0.5",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
        "Sec-WebSocket-Key": "bhiyci/haAmrH2yN1llp2g==",
        "Sec-WebSocket-Version": "13",
        "User-Agent": "ua"
        }
    #wheaders['Sec-WebSocket-Extensions']= 'permessage-deflate; client_max_window_bits'
    #wheaders['Sec-WebSocket-Key'] = str(base64.b64encode(bytes([random.randint(0, 255) for _ in range(16)])), 'ascii')
    #wheaders['Sec-WebSocket-Version'] = '13'
    #wheaders['Upgrade'] = 'websocket' 
    ws = WSMain(wheaders)

    try:
        ws.run_forever(
            origin="https://web.whatsapp.com",
            host="web.whatsapp.com")
    except InterruptedError:
        ws.close()


def WSMain(wheaders):
    def CombWSData(lastN,data):
        return str(int(time.time()))+'.--'+str(lastN)+','+data 
    
    def ParseWSAnsw(answ):
        try:
            return answ.split(".")[0],int(answ.split(",")[0].split(".")[1].split("-")[-1]),answ.split(",",1)[1]
        except:
            return None,None,None

    Credentials = {
        client:None,
        ttl:20.0,
        ref:None,
        serverTok:"",
        clientTok:"",

    }
    isEndOperation = False
    
    def on_message(ws,message):
        global Credentials
        _,nNex,data = ParseWSAnsw(message)
        print(ParseWSAnsw(message))
        if (data):
            data = json.loads(data)
            if data["status"] == 200:
                print(data)
                if "ttl" in data:
                    Credentials["ttl"] = int(data[ttl]/1000)
                    Credentials["ref"] = data["ref"]
                    time.sleep(Credentials["ttl"])

                else:
                    ws.send("?,,")
                    return
                print("[.] Ожидание доступа")
                ws.send(CombWSData(nNex+1,'["admin", "Conn", "reref"]'))

        elif(message[0] == "!"):
            time.sleep(Credentials["ttl"])
            ws.send(CombWSData(nNex+1,'["admin", "Conn", "reref"]'))
        elif(message[0:2] == "s1"):
            data = json.loads(message.split(",",1)[1])

            pass
    def on_open(ws):
        globals Credentials
        print("[.] Отправка данных на сервер whatsapp")
        Credentials["client"]= base64.b64encode(os.urandom(16))
        ws.send(CombWSData(0,'["admin","init",[2,2106,5],["Windows","Chrome","10"],"'+Credentials["client"]+'",true]'))
    def on_close(ws):
        ws.close()
    

    websocket.enableTrace(True)
    try:
        ws = websocket.WebSocketApp("wss://web.whatsapp.com/ws",
        on_message=on_message,
        on_open=on_open,
        on_close=on_close,
        header=wheaders
        )
    except Exception as e:
        print(e)
        exit(1)
    return ws
    #wsapp.run_forever()
    #ws.send('1615211849.--0,["admin","init",[2,2106,5],["Windows","Chrome","10"],"1or4RcKgySZG29pRL5XHDQ==",true]')
    #c1,c2,data = ParseWSAnsw(ws.recv())






