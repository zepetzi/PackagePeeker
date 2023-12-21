import { apiEndpointURL } from './apivar.js';

let statusMessage;

document.addEventListener('DOMContentLoaded', (event) => {
    setupTrackButtonListener();
    setupRefreshButtonListener();
    renderCurrentTracking();
});

async function setupTrackButtonListener() {

    //assign button element and add click listener for tracking button
    const trackButton = document.getElementById('trackButton');
    //upon click, start tracking handler func
    trackButton.addEventListener('click', trackingHandler);

}

async function setupRefreshButtonListener() {

    //assign button element and add click listener for refresh button
    const trackButton = document.getElementById('refreshButton');
    //upon click, start refresh func
    trackButton.addEventListener('click', refreshTracking);

}


async function trackingInputValidation(trackingInput) {

        //regex for testing the trackingNumber argument
        var ups = /^1Z[0-9A-Z]{16}$/;
        var fedex1 = /^\d{12}$/;
        var fedex2 = /^\d{15}$/;
        var usps1 = /^94\d{20}$/;
        var usps2 = /^92\d{20}$/;
        var usps3 = /^\d{30}$/;
        var usps4 = /^\d{26}$/;
    
        // conditional logic using the test() method
        if (ups.test(trackingInput)) {
            return 'UPS';
        } else if (fedex1.test(trackingInput) || fedex2.test(trackingInput)) {
            return 'FedEx';
        } else if (usps1.test(trackingInput) || usps2.test(trackingInput) || usps3.test(trackingInput) || usps4.test(trackingInput)) {
            return 'USPS';
        } else if (trackingInput == '') {

            console.error("No tracking number entered!");
            // statusMessage = "Unrecognized Carrier Format";
            // updateMessage(statusMessage);
            throw new Error("No tracking number entered!");

        } else {

            console.error("Unrecognized Carrier Format");
            // statusMessage = "Unrecognized Carrier Format";
            // updateMessage(statusMessage);
            throw new Error("Unrecognized Carrier Format");
        }

};
async function checkDupe(trackingInput) {
    //check if duplicate exists aka tracking number is already being tracked
    let dupeData = await chrome.storage.local.get(trackingInput);
    if (dupeData.hasOwnProperty(trackingInput)) {
        statusMessage = "Tracking number already exists!";
        console.log("Tracking number already exists!");
        updateMessage(statusMessage, "warning");
        throw new Error("Tracking number already exists!");

    }

    
};

async function trackingHandler() {

    
    //get info from the tracking info field
    statusMessage = "Loading..."
    updateMessage(statusMessage, "normal");
    const trackingField = document.getElementById('trackingNumberField');
    //get value inputted from input field
    const trackingInput = trackingField.value;

    

    //send to Lambda function, await response body json
    try {

        await checkDupe(trackingInput);
        //validate input 
        const carrierID = await trackingInputValidation(trackingInput);
        // responseBody is a json by now
        const responseBody = await sendToLambda(trackingInput, carrierID);
        
        if (responseBody){

            //if response body exists, attempt to save to chrome storage
            statusMessage = "Response body exists!";
            updateMessage(statusMessage, "success");
            console.log("resp body exists");
            await checkInfoFound(responseBody);
            await saveToChromeStorage(responseBody);
            await trackingInfoExtract(responseBody);


        } else {
            //otherwise error out
            statusMessage = "No response body received";
            updateMessage(statusMessage, "error");
            console.error("No response body received");

        }

    } catch (error) {

        console.error("Error", error.message);
        statusMessage = error.message;
        updateMessage(statusMessage, "error");
    }

};

//from trackingHandler:
async function sendToLambda(trackingInput, carrierID) {   
    //create payload for API gateway and send to endpoint

    const payload = {
        "inquiryNumber":trackingInput,
        "carrier":carrierID
    }

    const gatewayResp = await fetch(apiEndpointURL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }   
    });

    //if there's not an OK gateway response
    if (!gatewayResp.ok) {

        //get the status message and throw error with that message
        statusMessage = gatewayResp.statusText;
        updateMessage(statusMessage, "error");
        throw new Error(`Server responded with error: ${gatewayResp.status} ${gatewayResp.statusText}`);
    };

    //otherwise log to console that it was okay, and return the gateway response json
    console.log("gateway resp okay");
    statusMessage = "Gateway resp okay!"
    updateMessage(statusMessage, "success");
    return await gatewayResp.json();
    
};

async function checkInfoFound(responseBody) {

    if (responseBody["carrier"] == "FedEx"){
        if (responseBody?.finalTrackData?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.error !== undefined) {
            statusMessage = responseBody?.finalTrackData?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.error?.message;
            updateMessage(statusMessage, "error");
            throw new Error(`${statusMessage}`);
        }
    } else if (responseBody["carrier"] == "UPS") {
        if (responseBody?.finalTrackData?.trackResponse?.shipment?.[0]?.warnings !== undefined) {
            statusMessage = responseBody?.finalTrackData?.trackResponse?.shipment?.[0]?.warnings?.[0]?.message;
            updateMessage(statusMessage, "error");
            throw new Error(`${statusMessage}`);
        }
    }

};

async function saveToChromeStorage(responseBody){

    //get the tracking number as a string from the response body
    let trackString = responseBody["trackingNumber"];
    
    //checking if the tracking number is undefined
    if (!trackString) {
        statusMessage = "Tracking number not found in response";
        updateMessage(statusMessage, "error");
        throw new Error("Tracking number not found in response");
    };

    //check if the tracking info was found at all
    //if so, add to chrome storage
    try {
        // await trackingInfoExtract(responseBody);
        await chrome.storage.local.set({[trackString]: responseBody});
        console.log("tracking info added to local storage!");
        statusMessage = "Tracking list updated!";
        updateMessage(statusMessage, "success");
        

    } catch(error) {

        statusMessage = "Error adding to chrome storage";
        updateMessage(statusMessage, "error");
        console.error('Error adding to chrome storage:', error);
        throw error;

    }

};

async function updateMessage(statusMessage, type) {
    let currStatusText = document.getElementById("currentStatus");

    currStatusText.className = 'fst-italic';

    switch (type) {
        
        case 'success':
            currStatusText.classList.add('message-success');
            break;
        case 'error':
            currStatusText.classList.add('message-error');
            break;
        case 'warning':
            currStatusText.classList.add('message-warning');
            break;
        case 'normal':
            currStatusText.classList.add('message-normal');
            break;
    }

    currStatusText.textContent = statusMessage;
}

/*
Get most relevant info from trackingJSON in chrome storage 
and package into a new JSON and send to progress bar/visual elements
*/
async function trackingInfoExtract(responseBody) {

  let repackedJSON = {};  

  if (responseBody["carrier"] == "FedEx") {
    repackedJSON.carrier = "FedEx";
    repackedJSON.trackingNumber = responseBody["trackingNumber"],
    repackedJSON.trackingETA = responseBody?.finalTrackData?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.standardTransitTimeWindow?.window?.ends,
    repackedJSON.currentStatus = responseBody?.finalTrackData?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents?.[0]?.eventDescription
    repackedJSON.numEvents = responseBody?.finalTrackData?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents?.length
  
  } else if (responseBody["carrier"] == "UPS") {

    repackedJSON.carrier = "UPS";
    repackedJSON.trackingNumber = responseBody["trackingNumber"],
    repackedJSON.trackingETA = responseBody?.finalTrackData?.trackResponse?.shipment?.[0]?.package?.[0]?.deliveryDate?.[0]?.date,
    repackedJSON.currentStatus = responseBody?.finalTrackData?.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.[0]?.status?.description
    repackedJSON.numEvents = responseBody?.finalTrackData?.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.length

//   } else if (trackingJSON["carrier"] == "USPS") {
  

  };
  
  await renderHTML(repackedJSON);

};


async function renderHTML(repackedJSON) {
    //render the tracking info row to the popup.html

    let newTrackInfoDiv = document.createElement('div');
    newTrackInfoDiv.className = 'my-3 px-1 shadow-sm custom-margin-right';
    newTrackInfoDiv.id = repackedJSON.trackingNumber;

    let carrierField = repackedJSON.carrier;
    let etaField = await formatDate(repackedJSON.trackingETA.replace(/-/g, '').substring(0,8));

    let statusField = repackedJSON.currentStatus;
    let trackingNumField = repackedJSON.trackingNumber;
    
    let carrierTrackingURL;
    if (carrierField == "UPS") {
        carrierTrackingURL = `<a target="_blank" href="https://www.ups.com/track?track=yes&trackNums=${trackingNumField}"`;
    } if (carrierField == "FedEx") { 
        carrierTrackingURL = `<a target="_blank" href="https://www.fedex.com/fedextrack/?trknbr=${trackingNumField}"`;
    }

    let shippedYet = repackedJSON.numEvents > 1 ? true : false;
    let outforDelivery = statusField.toLowerCase().includes("out") || statusField.toLowerCase().includes("delivery")
    let deliveredYet = statusField.toLowerCase().includes("delivered") ? true : false;

    let greenProgress = '';

    // let progressPercent = shippedYet ? outforDelivery ? 75 : deliveredYet ? 100 : 40 : 0;
    let progressPercent = 40;
    let progressStriped = '-striped';
    let progressAnimated = '-animated';
    
    if (!shippedYet) {
        progressPercent = 0;
    } else if (outforDelivery) {
        progressPercent = 75;
    } else if (deliveredYet) {
        progressPercent = 100;
        greenProgress = 'bg-success';
        progressStriped = '';
        progressAnimated = '';

    };

    newTrackInfoDiv.innerHTML = `
        <div class="row gx-0">

            <div class="position-relative">
            <button type="button" class="btn btn-close btn-sm translate-start mt-0 ms-1 p-1 position-absolute top-100 start-100"></button>
            </div>

            <div class="col-9 text-start">
                <span id="trackDisplay" class="trackDisplay">Tracking Info For: </span>${carrierTrackingURL}<span id="trackingNumber" class="fst-italic">${trackingNumField}</span></a>
            </div>

            <div class="col-3 text-end">
              <span id="carrierDisplay" class="carrierDisplay">Carrier: </span> <span id="carrier" class="fst-italic">${carrierField}</span>
            </div>

        </div>

        <div class="progress border" id="trackingInfo"> 
            <div class="progress-bar progress-bar${progressStriped} progress-bar${progressAnimated} ${greenProgress}" role="progressbar" style="width: ${progressPercent}%" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        <div class="container px-0 my-1">

        <div class="row">
            <div class="col-8 text-start">
            ${statusField}<br>
            </div>

            <div class="col-4 text-end">
            <span id="etaDisplay" class="etaDisplay">ETA: </span>${etaField}
            </div>

        </div>
        `;

    let rowCloseButton = newTrackInfoDiv.querySelector('.btn-close')
        rowCloseButton.addEventListener('click', function() {
        
        newTrackInfoDiv.remove();
        chrome.storage.local.remove(trackingNumField);
    });
    
    document.getElementById('trackingContainer').appendChild(newTrackInfoDiv);

};

async function formatDate(dateString) {
        
    let year = dateString.substring(0,4);
    let month = dateString.substring(4,6);
    let day = dateString.substring(6,8);

    let newDateStr = new Date(year, month-1, day);

    const options = { year: 'numeric', month: 'short', day: 'numeric' };

    return newDateStr.toLocaleDateString('en-US', options);

};

async function refreshTracking() {

    chrome.storage.local.get(null, async function(items) {

        let allRBody = Object.values(items);

        if (allRBody.length === 0) {

            return;

        } else {

            for (let i = 0; i < allRBody.length; i++){
    
                let trackingInput = allRBody[i]["trackingNumber"];
                let carrierID = allRBody[i]["carrier"];

                try {
                    const responseBody = await sendToLambda(trackingInput, carrierID);
                
                    if (responseBody){

                        //if response body exists, attempt to save to chrome storage
                        await checkInfoFound(responseBody);
                        await saveToChromeStorage(responseBody);

                    } else {
                        //otherwise error out
                        statusMessage = `No response body received for ${trackingInput}`;
                        updateMessage(statusMessage, "error");
                        console.error("No response body received");

                    }
                
                } catch (error) {
                
                    console.error("Error", error.message);
                    statusMessage = error.message;
                    updateMessage(statusMessage, "error");
                }

            }

            await deRenderAllTracking()
            await renderCurrentTracking();
            statusMessage = "Tracking numbers refreshed!";
            updateMessage(statusMessage, "success");
            console.log("tracking numbers refreshed");

        }
    });

}

async function deRenderAllTracking() {
    let trackingContainer = document.getElementById('trackingContainer');
    while (trackingContainer.firstChild){
        trackingContainer.removeChild(trackingContainer.firstChild);
    }
}


async function renderCurrentTracking() {

    chrome.storage.local.get(null, function(items) {

        let allRBody = Object.values(items);

        if (allRBody.length === 0) {

            return;

        } else {

            for (let i = 0; i < allRBody.length; i++) {

                trackingInfoExtract(allRBody[i]);

            }
        }
    });

};
