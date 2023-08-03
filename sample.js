function validate(){

    console.log("hehehe");

    const userName=document.getElementById("userName").value
    const password=document.getElementById("password").value
    var reg= /^([a-zA-Z0-9\._]+)@([a-zA-Z0-9]+).([a-z]+)(.[a-z]+)?$/;
    var result=reg.test("email")


    if(userName.value===""){
      alert("Username must be filled")
      document.form1.userName.focus();
      return false
    }

    if(result==false){
      alert("Sorry! Invalid Email ID")
      return false
    }
    if(password.value===""){
      alert("Must have a password")
      document.form1.userName.focus();
      return false
    }

    return true

  }