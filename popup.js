document.addEventListener('DOMContentLoaded', (event) => {
    setupTrackButtonListener();
});


async function setupTrackButtonListener() {

    const trackButton = document.getElementById('trackButton');
    trackButton.addEventListener('click', trackingHandler);
}


async function trackingHandler() {

    const trackingField = document.getElementById('trackingNumberField');
    //get value inputted from input field
    const trackingInput = trackingField.value;

    try {
        const responseBody = await sendToLambda(trackingInput);
        
        if (responseBody){
            await saveToChromeStorage(responseBody);
        } else {

        }


    } catch (error) {

    console.error("Error")

    }

};


async function sendToLambda() {   
    //create payload for API gateway and send to endpoint
    const gatewayResp = await fetch('<>', {
        method: 'POST',
        body: JSON.stringify({"inquiryNumber":trackingInput}),
        headers: {
            'Content-Type': 'application/json'
        }   
    });

    if (!gatewayResp.ok) {
        throw new Error(`Server responded with error: ${gatewayResp.status} ${gatewayResp.statusText}`);
        var statusMessage = gatewayResp.statusText;
    };

    return await gatewayResp.json();
    console.log("gateway resp okay");

}

                //if response is successful 
                    //create object for the response
                    if (responseBody) {
                        /*
                        If it exists, create another object with the trackingnumber 
                        as the key and the object itself as the value
                        */

                        console.log("resp body exists");
                        var trackString = responseBody["trackingNumber"];
                        var storageObj = {};
                        storageObj[trackString] = responseBody;
                        
                        //check for duplicates:
                        //attempt to get the string from the local storage
                        //then if it exists and is returned, set statusMessage string to
                        //indicate that user is already tracking that number
                        chrome.storage.local.get(trackString, function(returnedItem) {
                            
                            if (returnedItem.hasOwnProperty(trackString)) {
                                
                                console.log("already exists");
                                var statusMessage = "Tracking Number Already Exists in List";
                            
                            } else {
                                
                                //otherwise, add to storage
                                chrome.storage.local.set(storageObj, function() {

                                    console.log("added to local storage");
                                    //if there's a storage error:
                                    if (chrome.runtime.lastError) {
                                        console.error('Local Storage Error', chrome.runtime.lastError.message);

                                        //updateStatus("Error adding number to local storage");

                                    } else {
                                        var statusMessage = "Tracking Number Added!";
                                    };
                                });
                            };
                        });

                    };

                //otherwise if there's no response body:
                // } else {

                    //so create variable that can be used to either display a message or information at the end?
                    //create text line mentioning error


                    // }

asdfasdfasdfasdf
            
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