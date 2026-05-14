const API_URL = "http://localhost:5000/api";

async function apiRequest(endpoint, method="GET", data=null){
    const token = localStorage.getItem("token");

    const options = {
        method,
        headers:{
            "Content-Type":"application/json"
        }
    };

    if(token){
        options.headers.Authorization = `Bearer ${token}`;
    }

    if(data){
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    return response.json();
}