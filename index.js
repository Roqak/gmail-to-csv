'use strict';
var fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const gmail = google.gmail('v1');
const ObjectsToCsv = require('objects-to-csv');
let dayjs = require("dayjs");
const csvWriter = createCsvWriter({
    // header: ["Failed", 'Transaction'],
    path: `${process.cwd()}/file.csv`
});
async function runSample(subject,after,before) {
    // Obtain user credentials to use for the request
    const auth = await authenticate({
        keyfilePath: path.join(__dirname, './client_id.json'),
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
    });
    google.options({auth});

    const res = await gmail.users.messages.list({userId:'me',q:`Subject:(${subject}) after:${new Date(after).getTime()/1000} AND before:${new Date(before).getTime()/1000}`})
    let mailIds = res.data.messages
    // let nn =await gmail.users.messages.get({userId:'me',id:res.data.messages})
    let snippets = await Promise.all(mailIds.map(async (x) => {
        let snip = await gmail.users.messages.get({userId:'me',id:x.id})
        // console.log("...............",dayjs(new Date(snip["data"]["internalDate"]*1000)).format('DD-MM-YYYY HH:MM:SS'))
        // console.log("...............",new Date(snip["data"]["internalDate"] * 1000).toISOString().substr(11, 8))
        snip = snip["data"]["snippet"]
        snip =  snip.split(" ")
        return Object.assign({},snip)
    }))
    const csv = new ObjectsToCsv(snippets);
    await csv.toDisk('./test.csv');

    // await csvWriter.writeRecords(snippets)
    // console.log("snippets",snippets)
    // stringify(snippets, {
    //     header: true
    // }, function (err, output) {
    //     fs.writeFile(__dirname+'/someData.csv', output);
    // })
}

if (module === require.main) {
    runSample("failed transaction notification for migo grb","2021/3/30 00:00:00","2021/3/30 23:59:00").catch(console.error);
}
module.exports = runSample;