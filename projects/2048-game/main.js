function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}  

let squares = [];
let values = [];

function populate2048() {
    let board = document.querySelector(".board");
  
    board.style.gridTemplateColumns = `repeat(${4}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${4}, 1fr)`;
  
    for (let i = 0; i < 16; i++) {
      let square = document.createElement("div");
      square.style.backgroundColor = "#D3D3D3";
      square.style.border = "1px solid burlywood"
      square.classList.add("square");
      board.insertAdjacentElement("beforeend", square);
      squares.push(square);
      values.push(0);
    }

    initiate();
}

let genVar = false;

function generateTiles(){
    genVar = genVar == true ? false : true;
    let tile = document.getElementById("newTile");
    if(genVar){
        tile.innerText = "Generate '2': " + "Off";
    }
    else{
        tile.innerText = "Generate '2': " + "On";
    }
}

function generateNew(){
    if(genVar) return;
    let a = getRandomInt(16);
    while(values[a] != 0){
        a = getRandomInt(16);
    }
    values[a] = 2;
    updateBoard();
}

function initiate() {
    let a = getRandomInt(16);
    let b = a;
    while(a == b){
        b = getRandomInt(16);
    }
    values[a] = 2;
    values[b] = 2;

    updateBoard();
}

function updateBoard(){
    var test = false;
    for(let i = 0; i < 16; i++){
        if(values[i] === 0){
            if(squares[i].innerText !== "") test = true;
            squares[i].innerText = "";
            continue;
        }
        if(squares[i].innerText !== values[i].toString()) test = true;
        squares[i].innerText = values[i].toString();
    }
    return test;
}

populate2048();

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        up();
        up();
        up();
        if(updateBoard()) generateNew();
    }
    else if (e.keyCode == '40') {
        down();
        down();
        down();
        if(updateBoard()) generateNew();
    }
    else if (e.keyCode == '37') {
       left();
       left();
       left();
       if(updateBoard()) generateNew();
    }
    else if (e.keyCode == '39') {
       right();
       right();
       right()
       if(updateBoard()) generateNew();
    }
}

function right(){
    for(let i = 0; i < 4; i++){
        let prev = 0;
        for(let j = 0; j < 4; j++){
            let conversion = i*4+j;
            if(prev === values[conversion]){
                values[conversion] *= 2;
                if(j > 0) values[conversion-1] = 0;
            }
            else if(j > 0 && values[conversion] === 0){
                values[conversion] = prev;
                values[conversion-1] = 0;
            }
            prev = values[conversion]
        }
    }
}

function down(){
    for(let i = 0; i < 4; i++){
        let prev = 0;
        for(let j = 0; j < 4; j++){
            let conversion = j*4+i;
            if(prev === values[conversion]){
                values[conversion] *= 2;
                if(j > 0) values[conversion-4] = 0;
            }
            else if(j > 0 && values[conversion] === 0){
                values[conversion] = prev;
                values[conversion-4] = 0;
            }
            prev = values[conversion];
        }
    }
}

function left(){
    for(let i = 0; i < 4; i++){
        let prev = 0;
        for(let j = 3; j >= 0; j--){
            let conversion = i*4+j;
            if(prev === values[conversion]){
                values[conversion] *= 2;
                if(j < 3) values[conversion+1] = 0;
            }
            else if(j < 3 && values[conversion] === 0){
                values[conversion] = prev;
                values[conversion+1] = 0;
            }
            prev = values[conversion]
        }
    }
}

function up(){
    for(let i = 0; i < 4; i++){
        let prev = 0;
        for(let j = 3; j >= 0; j--){
            let conversion = j*4+i;
            if(prev === values[conversion]){
                values[conversion] *= 2;
                if(j < 3) values[conversion+4] = 0;
            }
            else if(j < 3 && values[conversion] === 0){
                values[conversion] = prev;
                values[conversion+4] = 0;
            }
            prev = values[conversion];
        }
    }
}