const twilio = require('twilio');
const puppeteer = require('puppeteer');
const cron = require('node-cron');
const express = require('express');
const monk = require('monk');

require('dotenv').config();


var accountSid = process.env.ASID; // Your Account SID from www.twilio.com/console
var authToken = process.env.ATOKEN;   // Your Auth Token from www.twilio.com/console

const app = express();

const db = monk('localhost/DogeDB');
const dogecoin = db.get('dogecoin');

app.get('/', (req, res) => {
	dogecoin
		.find()
		.then(doge => {
			res.json(doge)
		});
});

app.listen(5000);

function saveDoge(doge) {
	if (doge != null) {

		const dogeCoin = {
			doge: JSON.stringify(doge),
			date: new Date(),
		};

		dogecoin
			.insert(dogeCoin)
			.then(createdDoge => {
				console.log(createdDoge);
			});
	} else {
		console.log("Doge failed to send data");
	}
}

cron.schedule('* * * * *', () => {
	console.log("Running a task every hour");

	(async () => {
		let url = "https://www.livecoinwatch.com/price/Dogecoin-DOGE";

		let browser = await puppeteer.launch();
		let page = await browser.newPage();

		await page.goto(url, { waitUntil: 'networkidle2' });

		let data = await page.evaluate(() => {
			let doge = document.querySelector('span[class="price"]').innerText;

			return {
				doge,
			}
		});

		let newDoge = data.doge.replace('$', '');
		let dogeCoin = parseFloat(newDoge);


		console.log(newDoge, dogeCoin);

		if (dogeCoin < 0.007000 || dogeCoin > 0.015000) {
			//create client and send text
			var client = new twilio(accountSid, authToken);

			client.messages.create({
				body: 'Check Dogecoin',
				to: process.env.NUMBER,  // Text this number
				from: process.env.TWILIO // From a valid Twilio number
			})
				.then((message) => console.log(message.sid));
		}

		saveDoge(data);

		console.log(data);

		//debugger;

		await browser.close();


	})();

});