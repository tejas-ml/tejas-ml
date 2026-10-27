var playing = false;
var score = 0;
var action;
var timeremaining = 60;
var correct;
var elements;

function shijak() {
    if (playing) {
        location.reload()
    } else {
        score = 0
        playing = true
    }
    document.getElementById("scorevalue").innerHTML = score;
    show("timeremaining")
    document.getElementById("startreset").innerHTML = "Reset Game"

    startCountdown()
}

function startCountdown() {
    generateQA()
    action = setInterval(function() {
        timeremaining--
        document.getElementById("timeremainingvalue").innerHTML = timeremaining
        if (timeremaining == 0) {
            stopCountdown()
            hide("correct")
            hide("wrong")
        }
    }, 1000)
}

function stopCountdown() {
    clearInterval(action)
    show("gameOver")
    document.getElementById("gameOver").innerHTML = "<p> Game Over!</p><p>Your score is " + score + "</p>"
    hide("timeremaining")
}

function hide(Id) {
    document.getElementById(Id).style.display = "none"
}

function show(Id) {
    document.getElementById(Id).style.display = "block"
}

function generateQA() {
    let x = Math.round(Math.random() * 9) + 1
    let y = Math.round(Math.random() * 9) + 1
    correct = x * y
    document.getElementById("question").innerHTML = x + "x" + y
    var correctPosition = 1 + Math.round(Math.random() * 3)
    document.getElementById("box" + correctPosition).innerHTML = correct
    elements = [correct, correct, correct, correct]
    for (let i = 1; i < 5; i++) {
        if (i == correctPosition) continue
        let inarray = true;
        while (inarray) {
            wrongAnswer = Math.round(Math.random() * 9) + 1
            wrongAnswer *= Math.round(Math.random() * 9) + 1
            inarray = false
            for (let j = 0; j < 4; j++) {
                if (elements[j] == wrongAnswer) inarray = true
            }
        }
        elements[i - 1] = wrongAnswer
        document.getElementById("box" + i).innerHTML = wrongAnswer
    }
}

function generateAddition() {
    let x = Math.round(Math.random() * 9) + 1
    let y = Math.round(Math.random() * 9) + 1
    correct = x + y
    document.getElementById("question").innerHTML = x + "+" + y
    var correctPosition = 1 + Math.round(Math.random() * 3)
    document.getElementById("box" + correctPosition).innerHTML = correct
    for (let i = 1; i < 5; i++) {
        wrongAnswer = correct + (i - correctPosition)
        elements[i - 1] = wrongAnswer
        if (i == correctPosition) continue
        document.getElementById("box" + i).innerHTML = wrongAnswer
    }
}

function validate(number) {
    if (elements[number] == correct) {
        show("correct")
        setTimeout(() => {
            hide("correct")
        }, 1000);
        score++
        document.getElementById("scorevalue").innerHTML = score;
        let temp = randomIntFromInterval(1, 2)
        if (temp == 1) {
            generateQA()
        } else {
            generateAddition()
        }
    } else {
        show("wrong")
        setTimeout(() => {
            hide("wrong")
        }, 1000);
    }
}

var wait = (ms) => {
    const start = Date.now();
    let now = start;
    while (now - start < ms) {
        now = Date.now();
    }
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}