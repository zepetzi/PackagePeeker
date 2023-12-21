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
        return 'Unknown or Unsupported Carrier';
    }
}

// Usage:
// var carrier = determineCarrier('');
// console.log(carrier);  // Outputs: UPS