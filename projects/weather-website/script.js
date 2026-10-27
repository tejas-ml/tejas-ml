let weather = {
    apiKey : "472b4b069000dc8fdcaef0454f3302ce"
}

let result = {};

async function displayWeather(city){
    try{
        const response = await fetch("https://api.openweathermap.org/data/2.5/weather?q=" + city + "&appid=" + "472b4b069000dc8fdcaef0454f3302ce");
        result = await response.json();
    }
    catch (error) {
        alert(error);
    }
    let temp = result.main.temp;
    temp -= 273;
    temp *= (9);
    temp /= 5;
    temp += 32;
    temp = Math.floor(temp);
    document.querySelector(".city").innerText = "Weather in " + city;
    document.querySelector(".temperature").innerText = "Temperature: " + temp.toString() + " F";
    document.querySelector(".description").innerText = "Weather Condition: " + result.weather[0].description;
    console.log(result);
}

function shijak() {
    var cty = document.querySelector(".search-bar").value;
    displayWeather(cty);
}

document.querySelector(".search-button").addEventListener("click", shijak);

displayWeather("Albuquerque");