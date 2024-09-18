function addNewWEField(){
   let newNode = document.createElement('textarea');
   newNode.classList.add('form-control');
   newNode.classList.add('weField');
   newNode.classList.add("mt-2");
   newNode.setAttribute("rows", 3);
   newNode.setAttribute("placeholder", "Enter Here")

   let weOb = document.getElementById("we");
   let weAddButtonOb = document.getElementById("weAddButton");
   
   weOb.insertBefore(newNode,weAddButtonOb);
}

function addNewAQField(){
    let newNode = document.createElement('textarea');
    newNode.classList.add('form-control');
    newNode.classList.add('eqField');
    newNode.classList.add("mt-2");
    newNode.setAttribute("rows", 3);
    newNode.setAttribute("placeholder", "Enter Here")
 
    let aqOb = document.getElementById("aq");
    let aqAddButtonOb = document.getElementById("aqAddButton");
    
    aqOb.insertBefore(newNode,aqAddButtonOb);
}

//generating cv
function generateCV(){
  //  console.log("generating");
  let nameField = document.getElementById('nameField').value; 
  let nameT1 = document.getElementById('nameT1');
  nameT1.innerHTML = nameField;
  let nameT2 = document.getElementById('nameT2');
  nameT2.innerHTML = nameField;

  let contactField = document.getElementById('contactField').value;
  let contactT = document.getElementById('contactT');
  contactT.innerHTML = contactField;

  document.getElementById('addressT').innerHTML= document.getElementById('addressField').value;

  document.getElementById('fbT').innerHTML= document.getElementById('fbField').value;
  document.getElementById('instaT').innerHTML= document.getElementById('instaField').value;
  document.getElementById('linkedT').innerHTML= document.getElementById('linkedField').value;

  //going to set objective
  document.getElementById('objectiveT').innerHTML= document.getElementById('objectiveField').value;

  let wes = document.getElementsByClassName("weField");

  let str=''

  for(let e of wes){
    str = str + `<li> ${e.value} </li>`;
  }
  document.getElementById("weT").innerHTML=str;

  //academic qualification
  let aqs=document.getElementsByClassName('eqField');
  let str1='';

  for(let e of aqs){
    str1 +=`<li> ${e.value} </li>`;
  }
  document.getElementById('aqT').innerHTML=str1 ;

  //code for profile generate
  let file = document.getElementById('imgField').files[0];
  console.log(file);
  let reader = new FileReader();
  reader.readAsDataURL(file);
  console.log(reader.result);
  // set the img to template

  reader.onloadend = function(){
    document.getElementById('imgTemplate').src = reader.result;
  }

  document.getElementById('cv-form').style.display='none';
  document.getElementById('cv-template').style.display='block';
}

//print cv
function printCV(){
    window.print();
}
