const trackButton = document.getElementById('trackButton');
const trackingField = document.getElementById('trackingNumberField');

trackButton.addEventListener('click', async function sendToLambda() {

    const trackingInput = trackingField.value;
        
        let gatewayResp = await fetch('<api gateway endpoint here>', {
            method: 'POST',
            body: JSON.stringify({"inquiryNumber":trackingInput}),
            headers: {
                'Content-Type': 'application/json'
            }

        });

        if (gatewayResp.ok) {
            let responseBody = await gatewayResp.json();
            
            if (responseBody) {

                

            }

        } else {

            //create text line mentioning error

            console.error('Error:', gatewayResp.status, gatewayResp.statusText);
        }


// if carrier, send to local storage 




// then for every item in local storage,


// depending on carrier, parse and sort tracking elements and populate progress bar




});


//upon 
