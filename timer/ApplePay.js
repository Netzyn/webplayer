async function onApplePayButtonClicked(payDataObj) {

    if (!PaymentRequest) {
        return;
    }
    
    try {

        const paymentMethodData = payDataObj.paymentMethodData;
        const paymentDetails = payDataObj.paymentDetails;
        const paymentOptions = payDataObj.paymentOptions;
        
        const request = new PaymentRequest(paymentMethodData, paymentDetails, paymentOptions);
            
        request.onmerchantvalidation = (event) => {
            const requestId = "req_" + Date.now();
          
            window._merchantValidationPromise = {};
            window._merchantValidationPromiseSettled = false;
            window._merchantValidationPromise.promise = new Promise((resolve, reject) => {
              window._merchantValidationPromise.resolve = (session) => {
                window._merchantValidationPromiseSettled = true;
                resolve(session);
              };
              window._merchantValidationPromise.reject = (error) => {
                window._merchantValidationPromiseSettled = true;
                reject(error);
              };
            });

            setTimeout(() => {
              if (!window._merchantValidationPromiseSettled) {
                console.error("Merchant validation promise was not resolved in time.");
                window._merchantValidationPromise.reject(new Error("Merchant validation timed out."));
              }
            },10000); // Timeout after 10 seconds

            const msg = {
              event: "merchant_validation",
              requestId,
              validationURL: event.validationURL
            };
            sendPaymentData(NZ_PAYMENT_MERCHANT_VALIDATION_REQUEST, msg);
                    
            event.complete(window._merchantValidationPromise.promise);
          };
          
        request.onpaymentmethodchange = event => {
          event.updateWith({});
        };
      
        request.onshippingaddresschange = event => {
          event.updateWith({});
        };
          
        const response = await request.show();
        window.applePaymentResponse = response; // Store the response globally for later use
        console.log("Payment Request Response:", response);
        sendPaymentData(NZ_PAYMENT_SUCCESS_RESPONSE, response); 
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