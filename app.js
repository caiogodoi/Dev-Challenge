// require csvtojson
var csv = require("csvtojson");
// Require `PhoneNumberFormat`.
var PNF = require('google-libphonenumber').PhoneNumberFormat;
// Get an instance of `PhoneNumberUtil`.
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

var fs = require('fs');


// Convert a csv file with csvtojson
csv()
  .fromFile('input.csv')
  .on("end_parsed",function(jsonArrayObj){

     var result = {};
     var nonAddressValue = ['fullname', 'eid', 'class', 'invisible', 'see_all']; // keys hardcode
     for(var posicao in jsonArrayObj) {

     	var linha = jsonArrayObj[posicao];
     	var id = linha.eid;

     	if (!result[id]) {
     		result[id] = {};
     		result[id]['addresses'] = [];
     		result[id]['classes'] = [];
     	}

        // foreach por coluna da linha
     	Object.keys(linha).forEach(function(key) {

     		// verifica se a key e addresses
     		var index = nonAddressValue.indexOf(key);

     		if (index > -1) {
				if (key == 'class') {
                    var classes = linha[key];

                    if (classes && classes != '') {
                        // verifica separacao por  virgula
                        var indexVirgula = classes.indexOf(',');
                        var indexBarra = classes.indexOf('/');
                        if (indexVirgula > -1) {
                            var classesArray = classes.split(",");
                            for (var i = 0; i < classesArray.length ; i++) {
                                // adiciona a classe e remove qualquer espaco antes ou depois
                                result[id]['classes'].push(classesArray[i].trim());
                            }
                        } else if (indexBarra > -1) {
                            var classesArray = classes.split("/");
                            for (var i = 0; i < classesArray.length ; i++) {
                                // adiciona a classe e remove qualquer espaco antes ou depois
                                result[id]['classes'].push(classesArray[i].trim());
                            }
                        } else {
                            result[id]['classes'].push(linha[key].trim());
                        }
                    }

				} else if (key == 'invisible' || key == 'see_all') {
					// se ja foi atualizado como true, nao sobrescreve
					if (result[id][key] && result[id][key] == true) {
						// nao faz nada 
					} else if (linha[key] == '1' || linha[key] == 'yes') {
						// se resultado for string 1 ou yes, atualiza como true
						result[id][key] = true;
					} else {
						// caso qualquer outro valor, atualiza como false
						result[id][key] = false;
					}
				} else {
					// atualiza todo os outros dados nonAddressValue
					result[id][key] = linha[key];
				}
     		} else {

                var tags = [];
                var res = key.split(" ");

                for (var i = 1; i < res.length ; i++) {
                    var tag = res[i];
                    //remove virgula
                    tag = tag.split(",")[0];

                    tags.push(tag);
                }

                if (res[0] == 'phone') {
                    //var phoneNumber = phoneUtil.parse(linha[key], 'BR'); // funcao do Google (nao consegui pegar o resultado)

                    var phone = ValidatePhone(linha[key]);

                    if(phone){
                        result[id]['addresses'].push({
                            "type": res[0],
                            "tags": tags,
                            "address": phone
                        });
                    }


                } else if (res[0] == 'email') {

                    var emails = linha[key].split("/");

                    // verifica todos os emails
                    for (var i = 0; i < emails.length ; i++) {
                        // remove qualquer espaco ou caracteres a mais
                        var email = emails[i].split(" ")[0];
                        // verifica se o email e valido
                        if(ValidateEmail(email)) {
                            result[id]['addresses'].push({
                                "type": res[0],
                                "tags": tags,
                                "address": email
                            });
                        }
                    }   
                }	
     		}
		});
    }

    // remove a eid key criada no array
    var resultArray = [];
    Object.keys(result).forEach(function(key) {
        console.log(result[key]);
        resultArray.push(result[key]);
    });
    var json = JSON.stringify(resultArray);
    fs.writeFile('output.json', json, 'utf8');

   })

  
function ValidateEmail(email){
    // expressao regular para verificar se o email e valido
    var regx = /^\w+([.-]?\w+)@\w+([.-]?\w+)(.\w{1,3})+$/;
    return regx.test(email);
}

function ValidatePhone(phone){
    var phoneCheck = phone.replace(/\D/g,'');
    // telefone tem que ter 10 (telefone) ou 11 (celular) digitos
    if(phoneCheck.length >= 10 && phoneCheck.length < 12){
        return phoneCheck;
    } 
    return false;
}