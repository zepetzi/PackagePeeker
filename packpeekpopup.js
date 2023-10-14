document.addEventListener('DOMContentLoaded', function() {
    // Get the button element
    var addButton = document.getElementById('addNumberButton');

    // Add click event listener to the button
    addButton.addEventListener('click', function() {
        // Get the tracking number from the input field
        var trackingNumber = document.getElementById('trackingNumber').value;

        // Check if the tracking number is not empty
        if(trackingNumber) {
            // Fetch tracking info from API
            fetch('https://yspp814n36.execute-api.us-west-1.amazonaws.com/dev', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ trackingNumber: trackingNumber }),
            })
            .then(response => response.json())
            .then(data => {
                // Check if API response is valid
                if(data && data.carrier) {
                    // Get elements to display tracking info
                    var carrierNameElem = document.getElementById('carrierName');
                    var progressBarElem = document.getElementById('progressBar');
                    var trackingInfoElem = document.getElementById('trackingInfo');

                    // Update elements with tracking info
                    carrierNameElem.textContent = data.carrier;
                    progressBarElem.value = data.progress; // assuming API returns a progress value
                    
                    // Show the tracking info
                    trackingInfoElem.style.display = 'block';
                } else {
                    alert('Invalid tracking number or no data available!');
                }
            })
            .catch((error) => {
                console.error('Error fetching data: ', error);
                alert('There was an error getting the tracking data. Please try again later.');
            });
        } else {
            alert('Please enter a tracking number!');
        }
    });
});