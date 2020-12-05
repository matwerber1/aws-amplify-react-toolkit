

exports.handler = async (event) => {
    // TODO implement
    console.log(JSON.stringify(event,null,2));
    const response = {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }, 
        body: JSON.stringify(event, null, 2),
        
    };
    return response;
};
