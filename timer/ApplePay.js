async function onApplePayButtonClicked(payDataObj) {

    // Consider falling back to Apple Pay JS if Payment Request is not available.
    if (!PaymentRequest) {
        return;
    }
    
    try {

        // Define PaymentMethodData
        const paymentMethodData = payDataObj.paymentMethodData;
        // Define PaymentDetails
        const paymentDetails = payDataObj.paymentDetails;
        // Define PaymentOptions
        const paymentOptions = payDataObj.paymentOptions;
        
        // Create PaymentRequest
        const request = new PaymentRequest(paymentMethodData, paymentDetails, paymentOptions);
            
        request.onmerchantvalidation = (event) => {
            const requestId = "req_" + Date.now();
          
            // Store a reference to resolve later
            window._merchantValidationPromise = {};
            window._merchantValidationPromise.promise = new Promise((resolve, reject) => {
              window._merchantValidationPromise.resolve = resolve;
              window._merchantValidationPromise.reject = reject;
            });
          
            // Send validation request to cloud app
            const msg = {
              event: "merchant_validation",
              requestId,
              validationURL: event.validationURL
            };
            sendPaymentData(NZ_PAYMENT_MERCHANT_VALIDATION_REQUEST, msg);
                    
            // Complete event using the promise that will be resolved when cloud responds
            event.complete(window._merchantValidationPromise.promise);
          };
    
        const response = await request.show();
        console.log("Payment Request Response:", response);
        // Handle the response
        sendPaymentData(NZ_PAYMENT_SUCCESS_RESPONSE, response); // Notify cloud app regarding payment success
    } catch (e) {
        // Handle errors
        sendPaymentData(NZ_PAYMENT_FAILURE_RESPONSE, getPaymentFailureData(e)); // Notify cloud app regarding payment failure
    }
}

function getPaymentFailureData(err) {
    return {
      error: err,
      message: 'Payment failed. Please try again or use a different payment method.'
    };
}

function launchApplePay(payDataObj){
    // payDataObj should contain the necessary payment data for Apple Pay
    // Here we assume it contains the required properties for the payment request
    onApplePayButtonClicked(payDataObj).catch(error => {
        console.error("Error launching Apple Pay:", error);
        sendPaymentData(NZ_PAYMENT_FAILURE_RESPONSE, getPaymentFailureData(error));
    });
}