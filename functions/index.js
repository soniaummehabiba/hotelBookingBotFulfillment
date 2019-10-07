'use strict';

const functions = require('firebase-functions');

const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

var firestore = admin.firestore();

const {WebhookClient} = require('dialogflow-fulfillment');

exports.webhook = functions.https.onRequest((request, response) => {
    const agent = new WebhookClient({request, response});

    // console.log('Dialogflow Request headers >> ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body >> ' + JSON.stringify(request.body));

    let intentMap = new Map();

    intentMap.set('book hotel', bookHotel);
    intentMap.set('count bookings', countBookings);
    intentMap.set('show all bookings', showBookings);

    agent.handleRequest(intentMap);

    function bookHotel(agent) {
        let params = agent.parameters;
        return firestore.collection('orders')
            .add(params)
            .then((docRef) => {
                console.log(`order added with ID ${docRef.id}`);
                return agent.add(`ok ${params.name} your hotel booking request of ${params.roomType} room for ${params.persons} persons is forwarded \n Have a good day`);
            })
            .catch((err) => {
                console.log(`Error in adding document ${err}`);
                return agent.add(`Error in adding document ${err}`);
            });
    }

    function countBookings(agent) {
        return firestore.collection("orders")
            .get()
            .then((querySnapshot) => {
                let orders = [];

                querySnapshot.forEach(doc => orders.push(doc.data()));

                if (orders.length) {
                    return agent.add(`you have ${orders.length} orders, would you like to see them?\n`);
                } else {
                    return agent.add(`you have\'nt order anything yet`);
                }
            })
            .catch((err) => {
                console.log(`Error in getting orders ${err}`);
                return agent.add(`Error getting orders ${err}`);
            });
    }

    function showBookings(agent) {
        return firestore.collection("orders")
            .get()
            .then((querySnapshot) => {
                let orders = [];

                querySnapshot.forEach(doc => orders.push(doc.data()));

                let speech = `here are your orders, \n The `;

                orders.forEach((order, i) => {
                    speech += `${i + 1} is hotel booking request for ${order.persons} ${order.roomType} rooms ordered by ${order.name} \n`;
                });

                return agent.add(speech);
            })
            .catch((err) => {
                console.log(`Error in getting orders ${err}`);
                return agent.add(`Error getting orders ${err}`);
            });
    }
});
