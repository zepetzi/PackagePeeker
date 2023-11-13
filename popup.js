let statusMessage;

document.addEventListener('DOMContentLoaded', (event) => {
    setupTrackButtonListener();
});

async function setupTrackButtonListener() {

    //assign button element and add click listener for tracking button
    const trackButton = document.getElementById('trackButton');
    //upon click, start tracking handler func
    trackButton.addEventListener('click', trackingHandler);

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
            saveToChromeStorage(responseBody);

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

    const gatewayResp = await fetch('<api here>', {
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


async function saveToChromeStorage(responseBody){

    //get the tracking number as a string from the response body
    let trackString = responseBody["trackingNumber"];
    
    //
    if (!trackString) {
        statusMessage = "Tracking number not found in response";
        updateMessage(statusMessag, "error");
        throw new Error("Tracking number not found in response");
    };

    try {

        await chrome.storage.local.set({[trackString]: responseBody});
        console.log("tracking info added to local storage");
        statusMessage = "Tracking info added to local storage";
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
async function trackingInfoExt(trackingNumber) {

  if (trackingNumber[]  

};




                    //so create variable that can be used to either display a message or information at the end?
                    //create text line mentioning error


                    // }


            //try statementss

    // now (re)render visual elements?
    // if carrier, send to local storage 

    // then for every item in local storage

    // depending on carrier, use the correct render function parse and sort tracking elements and populate progress bar


 



/*
------- storage testing -------
let rando = Math.random();
let randString = rando.toString();

localStorage.setItem([randString], 'value1');
console.log("added to storage")
});
-------------------------------
*/