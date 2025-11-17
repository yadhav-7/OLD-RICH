
async function apiReq(url, method = 'GET', data = null, headers = {}) {
  try {

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-By': 'frontend-fetch',
        ...headers,
      },
    }

    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options)

     const result = await response.json()
     if (response.status === 401) {
     
      window.location.href = result.redirect
      return;
    }

   
    
    return result

  } catch (error) {
    return res.status(400).json({
      error: error.message,
      success: false
    })
  }
}

window.apiReq = apiReq
