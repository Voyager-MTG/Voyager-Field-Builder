// const { Jimp } = require('jimp');

// modified JSON.stringify for cards file
function JSONfriendly(obj) {
	let out = "";
	for(let k in obj) {
		console.log("friendlying" + k)
		out += `"${k}": ${JSON.stringify(obj[k])},\n`;
	}
	return `{\n${out.replace(/,\n$/, "\n}")}`;
}

//returns array of duplicate elements between two arrays
function arrayDuplicates(array1, array2) {
	let shortArray = [];
	let longArray = [];
	let dupeArray = [];
	if(array1.length > array2.length) {
		shortArray = array2;
		longArray = array1;		
	}else{
		shortArray = array1;
		longArray = array2;	
	}
	for(let value in shortArray) {
		if(longArray.includes(shortArray[value]))
			dupeArray.push(shortArray[value]);
	}
	return dupeArray;
}

// input two arrays, returns three arrays
// [0] - contains elements exclusive to array1
// [1] - contains elements exclusive to array2
// [2] - contains elements shared by both arrays
function arrayDiagram(array1, array2) {
	let array1_exclusive = [];
	let array2_exclusive = [];
	let shared = [];
	
	for(let e in array1) {
		if(array2.includes(array1[e])) {
			shared.push(array1[e])
		}else{
			array1_exclusive.push(array1[e]);
		}
	}
	for(let e in array2) {
		if(!shared.includes(array2[e]))
			array2_exclusive.push(array2[e]);
	}
	
	return [array1_exclusive, array2_exclusive, shared];
}


exports.JSONfriendly = JSONfriendly;
exports.arrayDiagram = arrayDiagram;
exports.arrayDuplicates = arrayDuplicates;