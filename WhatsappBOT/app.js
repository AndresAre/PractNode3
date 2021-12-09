const fs = require('fs');

const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const moment = require('moment');

const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode  = require('qrcode-terminal');
const { fstat } = require('fs');
const bodyParser = require('body-parser');
const app = express();

const SESSION_FILE_PATH = './session.json';
let client;
let sessionData;


app.use(cors())
app.use(
    bodyParser.json()
)
app.use(
    bodyParser.urlencoded()
)

const sendWithApi = (req, res) => {
    const {message, to} = req.body;
    const newNumber = `${to}@c.us`
    console.log(message, to);
    sendMessage(newNumber, message)
    res.send({ status: 'Enviado'});
}


app.post('/send', sendWithApi)

const withSession = () =>{
    /**Si existe cargamos */
    sessionData = require(SESSION_FILE_PATH);
    client = new Client({
        session: sessionData
    })

    client.on('ready', () =>{
        console.log('Cliente is ready! ');
        listenMessage();
    })

    client.on('auth_failure', () =>{
        console.log('** ERROR DE AUTENTICACION ** ');
    })

    client.initialize();
}

/**
 *  Esta funcion GENERA EL QRCODE
 */
const withOutSession = () =>{
    console.log("No tenemos session guardada");
    client = new Client();
    client.on('qr', qr=>{
        qrcode.generate(qr, {small:true});
    });

    client.on('authenticated', (session) =>{
        //Guardamos credenciales de session para usar luego
        sessionData = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err){
            if(err){
                console.log(err);
            }
        });
    });

    client.initialize();

}


/**
 *  Funcion encargada de escuchar cada vez que un mensaje entra nuevo
 */
const listenMessage = () => {
    client.on('message', (msg) => {
        /** Preguntas frecuentes */

        switch(body){
            case 'quiero_info':
                sendMessage(from, 'Whatsapp!')
                break;
            case 'adios':
                sendMessage(from, 'Nos vemos pronto!');
                break;
            case 'hola':
                sendMessage(from, 'Bienvenido !!')
                sendMedia(from, 'curso-1.png')
                break;
        }
        saveHistorial(from, body);
        const {from, to, body} = msg;
        console.log(from, to, body); 
    })
}

const sendMedia = (to, file) =>{
    const mediaFile = MessageMedia.fromFilePath(`./mediaSend/${file}`)   
    client.sendMessage(to, mediaFile)
}

const sendMessage = (to, message) => {
    client.sendMessage(to, message)
}

const saveHistorial = (number, message) => {
    const pathChat = `./chats/${number, message}`
    const workbook = new ExcelJS.Workbook();
    const today = moment().format('DD-MM-YYYY hh:mm');

    //Verificacion si el chat ya fue creado
    if(fs.existsSync(pathChat)){
        workbook.xlsx.readFile(pathChat)
        .then(()=>{
            //Hagara la primera pestaña del excel
            const worksheet = workbook.getWorksheet(1);
            const lastRow = worksheet.lastRow;
            let getRowInsert = worksheet.getRow(++(lastRow.number))
            getRowInsert.getCell('A').value = today;
            getRowInsert.getCell('B').value = message;  
            getRowInsert.commit();
            workbook.xlsx.writeFile(pathChat)
            .then(()=>{
                console.log('Se agrego chat!');
            })
            .catch(()=>{
                console.log('Algo ocurrio guardando el chat!');
            })
        })
    }else{
        const worksheet = workbook.addWorksheet('Chats');
        //Definir los encabezados
        worksheet.columns = [
            {header: 'Fecha', key: 'date'},
            {header: 'Mensaje', key: 'message'}
        ]
        worksheet.addRow([today, message])
        worksheet.xlsx.writeFile(pathChat)
        .then( () =>{
            console.log('Historial creado!!');
        })
        .catch( () =>{
            console.log('Algo fallo!');
        })
        //CREAMOS
    }
}

/** Condicion tenearia (de una sola linea), verifica que existe el archivo SESSION_FILE_PATH, si existe ejecuta withSession si no ejecuta withOutSession */
(fs.existsSync(SESSION_FILE_PATH)) ? withSession() : withOutSession(); 

app.listen(9000, () =>{
    console.log('API ESTA ARRIBA')
})