/*global fetch*/

// test comment

let fedexID = process.env.fedexID;
let fedexSecret = process.env.fedexSecret;
let upsID = process.env.upsID;
let upsSecret = process.env.upsSecret;

//Upload test

export const handler = async (event) => {
    
    //Function for determing tracking number carrier
    function determineCarrier(trackingNumber) {
    
        //regex for testing the trackingNumber argument
        var ups = /^1Z[0-9A-Z]{16}$/;
        var fedex1 = /^\d{12}$/;
        var fedex2 = /^\d{15}$/;
        var usps1 = /^94\d{20}$/;
        var usps2 = /^92\d{20}$/;
        var usps3 = /^\d{30}$/;
        var usps4 = /^\d{26}$/;
    
        // conditional logic using the test() method
        if (ups.test(trackingNumber)) {
            return 'UPS';
        } else if (fedex1.test(trackingNumber) || fedex2.test(trackingNumber)) {
            return 'FedEx';
        } else if (usps1.test(trackingNumber) || usps2.test(trackingNumber) || usps3.test(trackingNumber) || usps4.test(trackingNumber)) {
            return 'USPS';
        } else {
            return 'Unknown';
        }
    
    }
    
    //execute determination of carrier
    var carrier = determineCarrier(event['inquiryNumber']);
    
    
    // ----------- start of UPS OAuth validation -----------

    async function getUPSTrackingInfo(event) {

        const formData = {
            grant_type: 'client_credentials'
        };
    
        const oAuthRespUPS = await fetch(
            `https://wwwcie.ups.com/security/v1/oauth/token`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'x-merchant-id': 'string',
                    Authorization: 'Basic ' + Buffer.from(`${upsID}:${upsSecret}`).toString('base64')
                },
                body: new URLSearchParams(formData).toString()
            }
        );
    
        const oAuthJSON = await oAuthRespUPS.json();
    
        const oAuthTok = oAuthJSON["access_token"];
    
        
        // testing output for oAuth token
    
        // console.log("This is the oAuth Token: " + oAuthTok);
        
        // ----------- start of UPS API tracking request -----------
    
        const query = new URLSearchParams({
            locale: 'en_US',
            returnSignature: 'false'
        }).toString();
    
        const inquiryNumber = event['inquiryNumber'];
        const trackingResp = await fetch(
            `https://onlinetools.ups.com/api/track/v1/details/${inquiryNumber}?${query}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    transId: 'test',
                    transactionSrc: 'testing',
                    Authorization: 'Bearer ' + oAuthTok
                }
            }
        );
        
        // returns JSON to be stored in finalTrackData
        return trackingResp.json();
    }
    
    
    async function getFedExTrackingInfo(event) {
    
      const fedexOAparams = new URLSearchParams();
      fedexOAparams.append('grant_type', 'client_credentials');
      fedexOAparams.append('client_id', `${fedexID}`);
      fedexOAparams.append('client_secret', `${fedexSecret}`);
    
      try {
        // Make the POST request
        const fedexOAresponse = await fetch('https://apis.fedex.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: fedexOAparams,
        });
    
        // Check for a successful response
        if (!fedexOAresponse.ok) {
          throw new Error('Network response was not ok ' + fedexOAresponse.statusText);
        }
    
        // Parse and log the JSON from the response
        const oAuthData = await fedexOAresponse.json();
        var fedexToken = oAuthData["access_token"];
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    
    
    //--------- [][][][][] Fedex Tracking Number Functionality [][][][][] --------- 
    
     
      const fedextrackPayload = {
        includeDetailedScans: true,
        trackingInfo: [
            {
                trackingNumberInfo: {
                    trackingNumber: event['inquiryNumber']
                }
            }
        ]
      };
    
    
      try {
          const fedexTrackResponse = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'X-locale': 'en_US',
                  'Authorization': 'Bearer '+ fedexToken // Add your token here
              },
              body: JSON.stringify(fedextrackPayload)
          });
    
          if (!fedexTrackResponse.ok) {
              throw new Error('Network response was not ok ' + fedexTrackResponse.statusText);
          }
    
          const fedexTrackData = await fedexTrackResponse.json();
          return fedexTrackData;
        
      } catch (error) {
          console.error('There has been a problem with your fetch operation:', error);
      }
      

    }
    
    
    // conditional logic for carriers
    
    if (carrier == 'UPS') {
        var finalTrackData = await getUPSTrackingInfo(event);    
    } 
    
    else if (carrier == 'FedEx') {
        var finalTrackData = await getFedExTrackingInfo(event);
    }
    
    else if (carrier == 'USPS') {
        // var finalTrackData = await getUSPSTrackingInfo(event);
        var finalTrackData = {"Details": "Not Implemented"}
    }
    
    else if (carrier == 'Unknown') {

        var finalTrackData = JSON.stringify({"error-message":"Unknown or Unsupported Carrier"});

    }    

    //return JSON or text to calling function
    return {carrier, "trackingNumber":event['inquiryNumber'], finalTrackData}; 
    
    
} 
    


