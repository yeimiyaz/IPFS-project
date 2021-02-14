const ipfsClient = require('ipfs-http-client')
const express = require('express')
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const BufferList = require('bl/BufferList')

const ipfs = new ipfsClient({ host: '127.0.0.1', port: '5001', protocol: 'http' })
const app = express()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(fileUpload())

app.get('/', (req, res) => {
    res.render('home')    
})

app.post('/upload', (req, res) => {
    const file = req.files.file
    const fileName = req.body.fileName
    console.log(fileName);
    const filePath = 'files/' + fileName
    console.log(filePath);

    file.mv(filePath, async (err) => {
        if (err) {
            console.log('error: failed to download the file.')
            return res.status(500).send(err)
        }
        const fileHash = await addFile(fileName, filePath)
        console.log("upload file");
        console.log(fileHash);
        res.render('upload', { fileName, fileHash })
    })
})

app.post('/download', (req, res) => {
    const hash = req.body.hash
    console.log("hash: " + hash);
    const file = downloadFile(hash)
    console.log("downloaded file");
    res.render('download', { hash })
})

const addFile = async (fileName, filePath) => {
    // readFileSync() returns a Buffer
    const file = fs.readFileSync(filePath)
    //Add the file to IPFS
    const fileAdded = await ipfs.add({ path: fileName, content: file })
    //Capture the hash of the file
    const fileHash = fileAdded.cid
    return fileHash
}

const downloadFile = async (hash) => {
    //create a buffer
    let content = new BufferList();

    // get the file using the hash
    for await (const file of ipfs.get(hash)) {

        for await (const chunk of file.content) {
            //add to the buffer
            content.append(chunk)
        }
        //console.log(content.toString())

        //write the buffer in a file
        fs.writeFile("test.txt", content, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("The file was saved!");
            }
        });
    }
};
app.listen(3000, '127.0.0.1', () => {
    console.log('Server is running on port 3000')
})