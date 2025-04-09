const fs = require('fs');
const Jimp = require('jimp');
const toolbox = require('./src/toolbox.js');
const stitch = require('./src/stitch.js');
const rick = require('./src/rick.js');

let WIDE_TYPES = /Battle/;
let FILE_TYPE = "jpg";
const CARD_WIDTH = 375;
const CARD_HEIGHT = 523;
const CARD_OFFSET = 2;
const BATTLE_OFFSET = 74;

const CROP_VALS = {
	DFC: {
		LEFT_HEIGHT_OFFSET: 0,
		LEFT_WIDTH_OFFSET: 0,
		LEFT_HEIGHT: CARD_HEIGHT,
		LEFT_WIDTH: CARD_WIDTH,
		RIGHT_HEIGHT_OFFSET: 0,
		RIGHT_WIDTH_OFFSET: CARD_WIDTH + CARD_OFFSET,
		RIGHT_HEIGHT: CARD_HEIGHT,
		RIGHT_WIDTH: CARD_WIDTH
	},
	TO_BATTLE: {
		LEFT_HEIGHT_OFFSET: 0,
		LEFT_WIDTH_OFFSET: 0,
		LEFT_HEIGHT: CARD_WIDTH,
		LEFT_WIDTH: CARD_HEIGHT,
		RIGHT_HEIGHT_OFFSET: BATTLE_OFFSET,
		RIGHT_WIDTH_OFFSET: CARD_HEIGHT + CARD_OFFSET,
		RIGHT_HEIGHT: CARD_HEIGHT,
		RIGHT_WIDTH: CARD_WIDTH
	},
	FROM_BATTLE: {
		LEFT_HEIGHT_OFFSET: 0,
		LEFT_WIDTH_OFFSET: BATTLE_OFFSET,
		LEFT_HEIGHT: CARD_HEIGHT,
		LEFT_WIDTH: CARD_WIDTH,
		RIGHT_HEIGHT_OFFSET: 0,
		RIGHT_WIDTH_OFFSET: CARD_WIDTH + CARD_OFFSET,
		RIGHT_HEIGHT: CARD_WIDTH,
		RIGHT_WIDTH: CARD_HEIGHT
	},
	DOUBLE_BATTLE: {
		LEFT_HEIGHT_OFFSET: 0,
		LEFT_WIDTH_OFFSET: BATTLE_OFFSET,
		LEFT_HEIGHT: CARD_WIDTH,
		LEFT_WIDTH: CARD_HEIGHT,
		RIGHT_HEIGHT_OFFSET: BATTLE_OFFSET,
		RIGHT_WIDTH_OFFSET: CARD_HEIGHT + CARD_OFFSET,
		RIGHT_HEIGHT: CARD_WIDTH,
		RIGHT_WIDTH: CARD_HEIGHT
	}
}

let new_sets = {};
let run_images = true;
let msem_sets = [];
let rev_sets = [];
let mtg_sets = [];
let error_count = 0;
let stage = 0;

// format files
function prepareFiles() {
	// make sure we have an lbfiles folder
	fs.mkdir(__dirname + "/lbfiles", (err) => {
		if(err) {
			console.log("lbfiles folder found");
		}else{
			console.log("lbfiles folder created");
		}
	});
	// make sure we have an final folder
	fs.mkdir(__dirname + "/final", (err) => {
		if(err) {
			console.log("final folder found");
		}else{
			console.log("final folder created");
		}
		// make sure we have our image folders
		fs.mkdir(__dirname + "/final/pics", (err) => {
			if(err) {
				console.log("pics folder found");
			}else{
				console.log("pics folder created");
			}
			// make sure we have our tokens folder
			fs.mkdir(__dirname + "/final/pics/tokens", (err) => {
				if(err) {
					console.log("tokens folder found");
				}else{
					console.log("tokens folder created");
				}
			});

		});

	});
	
	// rename folders to their set code
	fs.readdir("./files", (err1, fns1) => {
		for(let f1 in fns1) {
			let fn1 = fns1[f1];
			if(!fn1.match(/pool/i))
				continue;
			fs.readdir("./files/"+fn1, (err, fns) => {
				for(let f in fns) {
					let fn = fns[f];
					if(!fn.match(/.txt$/))
						continue;
					
					fs.readFile('./files/'+fn1+'/'+fn, 'utf8', (err, data) => {
						try {
							let exported = JSON.parse(data);
							let cards = {};
							let meta = {title:""};
							let sc = "";
							if(exported.meta) {
								cards = stitch.arrayExpand(exported.cards);
								meta = exported.meta;
								sc = exported.meta.setID;
							}else{
								cards = stitch.arrayExpand(exported);
								sc = exported[0].setID;
								if(sc == "tokens")
									sc = exported[0].parentSet;
							}

							if(!sc)
								throw `File ${fn} does not have a set code.`;
							if(new_sets.hasOwnProperty(sc)) {
								let ticker = 1;
								let test_sc = sc + ticker;
								while(new_sets.hasOwnProperty(test_sc)) {
									ticker++;
									test_sc = sc + ticker;
								}
								console.log(`${fn}: Set code ${sc} is taken, reassigned to ${test_sc}.`)
								for(let c in cards) {
									if(cards[c].setID == sc) {
										cards[c].setID = test_sc;
									}
									if(cards[c].parentSet == sc) {
										cards[c].parentSet = test_sc;
									}
								}
								sc = test_sc;
							}
							new_sets[sc] = {
								cards: cards,
								longname: meta.title,
								pool: fn1
							};
							let folder_name = fn.replace(/(-field-test)?.txt/, "");
							if(!fns.includes(folder_name))
								folder_name += "-files";
							if(!fns.includes(folder_name))
								throw `File ${fn} does not have a matching image folder.`;
							
							if(fn != sc+".txt") {
							fs.rename(`./files/${fn1}/${fn}`, `./files/${fn1}/${sc}.txt`, (err) => {
									if(err)
										console.log("error here 1");
										throw err;
									console.log(`Renamed ${fn} to ${sc}.txt`);
								});
							}
							if(folder_name != sc) {
								fs.rename(`./files/${fn1}/${folder_name}`, `./files/${fn1}/${sc}`, (err) => {
									if(err) {
										console.log("error here 2");
										throw err;
									}
									console.log(`Renamed ${folder_name} to ${sc}`);
								});
							}
						}catch(e) {
							error_count++;
							console.log(e);
						}
						
					})
					
				}
			})
		}
	})
}
// combine the files into a single library
async function combineFiles() {
	let cards = {};
	let setData = {};
	let nextNo = 1;
	for(let s in new_sets) {
		for(let c in new_sets[s].cards) { // Transfer new_sets.cards into let cards (line 190)
			cards[c] = new_sets[s].cards[c];
		}
		setData[s] = {
			longname: new_sets[s].longname,
			Design: "",
			Link: "",
			releaseNo: nextNo,
			releaseDate: "",
			Draft: 0,
			basics: 0,
			pool: new_sets[s].pool,
			masterpiece: false,
			packSlots: []
		}
		nextNo++;
	}
	
	let library = {
		cards: {},
		setData: {},
		legal: {}
	};
	for(let k in format_args) {
		if(format_args[k].length) {
			let partialLib = await apiPartialLibrary(k);
			if(!partialLib.cards)
				continue;
			for(let s in partialLib.setData) {
				library.setData[s] = partialLib.setData[s];
			}
			for(let c in partialLib.cards) {
				library.cards[c] = pakrtialLib.cards[c];
				library.cards[c].from_lackey = true;
			}
		}
	}
	
	stitch.stitchLibraries(library, {cards:cards, setData:setData});
	console.log("writing lb files")
	fs.writeFile('./lbfiles/cards.json', toolbox.JSONfriendly(library.cards), (err) => {
		if(err) {
			console.log(err);
		}else{
			console.log("LackeyBot cards file written.");
		}
	});
	console.log("done writing")
	// fs.writeFile('./lbfiles/setData.json', JSON.stringify(library.setData, null, 1), (err) => {
	// 	if(err) {
	// 		console.log(err);
	// 	}else{
	// 		console.log("LackeyBot setData file written.");
	// 	}
	// })
	// let pools = {};
	// for(let s in new_sets) {
	// 	let p = new_sets[s].pool;
	// 	if(!pools.hasOwnProperty(p))
	// 		pools[p] = [];
	// 	pools[p].push(s);
	// }
	// for(let p in pools) {
	// 	pools[p] = pools[p].sort();
	// }
	// fs.writeFile('./lbfiles/pools.json', JSON.stringify(pools, null, 1), (err) => {
	// 	if(err) {
	// 		console.log(err);
	// 	}else{
	// 		console.log("LackeyBot pool file written.");
	// 	}
	// })
	rick.initialize(library);
	console.log("done init")
	rick.tokenBuilding({
		writeTokens: './final/tokens.xml'
	});
	console.log("done tokens")
	rick.cardBuilding({
		writeCards: './final/cards.xml'
	});
	console.log("done cards")
	if(run_images) {
		let trice_names = rick.keysToNames();
		processImages(library, trice_names);
	}
}
function windex(str) {
	str = str.replace(" // ", "");
	str = str.replace(/[\\\/<>:*"?]/g, "");
	return str;
}
function processImages(library, trice_names) {
	// rename normal cards to trice_names[id]
	// split dfcs and rename their images
	console.log("Updating image names...")
	for(let c in library.cards) {
		let card = library.cards[c];
		let names = trice_names[c];
		let si = card.setID;
		if(si == "tokens")
			si = card.parentSet;
		if(card.from_lackey)
			continue;
		let pi = library.setData[si].pool;
		let current = `./files/${pi}/${si}/${card.cardID}.${FILE_TYPE}`;
		fs.exists(current, (exists) => {
			if(!exists)
				return;
			if(names.length > 1) {
				if(card.shape == "doubleface") {
					// split this image, then delete this file
					let b2 = card.typeLine2.match(WIDE_TYPES);
					splitImage(current, `./files/${pi}/${si}/`, names, b2);
				}else{
					// this file needs duplicated
					forkImage(current, `./files/${pi}/${si}/`, names); // ./files/Voyager Pool/[set]/[cardname]
				}
			}else{
				// rename this file
				let dest = `./files/${pi}/${card.setID}/${windex(names[0])}.${FILE_TYPE}`;
				// if token, put it in the final token folder instead
				if(card.setID == "tokens")
					dest = `./final/pics/tokens/${windex(names[0])}.${FILE_TYPE}`;
				fs.rename(current, dest, (err) => {
					if(err)
						console.log("error here 3");
						console.log(err);
				})
			}
		})
	}
}
function splitImage(fn, dir, names, b2) {
	// console.log(Jimp);
	Jimp.read(fn, (err, img) => {
		if(err) {
			console.log(err);
		}else{
			let shape = CROP_VALS.DFC;
			if(img.bitmap.width >= 2*CARD_HEIGHT) {
				// double battle
				shape = CROP_VALS.DOUBLE_BATTLE;
			}else if(img.bitmap.width >= (CARD_WIDTH+CARD_HEIGHT)) {
				// battle on one side
				shape = CROP_VALS.FROM_BATTLE;
				if(b2)
					shape = CROP_VALS.TO_BATTLE;
			}
			
			img.clone().crop(shape.LEFT_WIDTH_OFFSET, shape.LEFT_HEIGHT_OFFSET, shape.LEFT_WIDTH, shape.LEFT_HEIGHT).write(dir+windex(names[0])+"."+FILE_TYPE);
			img.crop(shape.RIGHT_WIDTH_OFFSET, shape.RIGHT_HEIGHT_OFFSET, shape.RIGHT_WIDTH, shape.RIGHT_HEIGHT).write(dir+windex(names[1])+"."+FILE_TYPE);
			
			console.log("deleteing" + fn);
			fs.unlink(fn, (er) => {
				if(er)
					console.log(er)
			})
			console.log("done");
		}
	})
}
function forkImage(fn, dir, names) {
	console.log(names);
	console.log(dir);
	console.log(fn);
	console.log(Jimp);
	Jimp.read(fn, (err, img) => {
		if(err) {
			console.log(err);
		}else{
			// for(let n = 0; n < names.length; n++) {
			img.clone().write(dir+windex(names[0])+"."+FILE_TYPE);
			// }
			fs.rename(fn, dir+windex(names[0])+"."+FILE_TYPE, (er) => {
				if(er)
					console.log("error here 4");
					console.log(er);
			})
		}
	})
	console.log("i-------------------------------");
}
async function apiPartialLibrary(k) {
	let format = k.replace(/^--/, "");
	let body = JSON.stringify({format:format, sets:format_args[k]});
	
	let resp = await fetch('https://lackeybot.com/api/library', {
		method: "POST",
		headers: {
		  'Accept': 'application/json',
		  'Content-Type': 'application/json'
		},
		body: body
	})
	
	let s = await streamToString(resp.body);
	let j = {};
	try {
		j = JSON.parse(s);
		j = j.body;
	}catch(e){
		console.log(e);
	}
	
	return j;
}
async function streamToString(stream) {
  const reader = stream.getReader();
  const textDecoder = new TextDecoder();
  let result = '';

  async function read() {
    const { done, value } = await reader.read();

    if (done) {
      return result;
    }

    result += textDecoder.decode(value, { stream: true });
    return read();
  }

  return read();
}

function relocateCardImages() {
	for(let s in new_sets) {
		let pi = new_sets[s].pool;
		fs.rename(`./files/${pi}/${s}`, `./final/pics/${s}`, (err) => {
			if(err)
				console.log("error here 5");
				console.log(err)
		})
	}
}
process.on('beforeExit', () => {
	stage++;
	switch(stage) {
		case 1:
			if(error_count > 0) {
				console.log("Terminating script due to errors");
			}else{
				console.log("Everything looks good, preparing files");
				combineFiles();
			}
			break;
		case 2:
			if(run_images) {
				console.log("Moving images to single folder");
				relocateCardImages();
			}
			break;
		case 3:
			console.log("Finished!");
			break;
	}
})

if(process.argv.includes("--noimages")) {
	run_images = false;
}

// grab sets from command line
let format_args = {
	"--msem": msem_sets,
	"--rev": rev_sets,
	"--revolution": rev_sets,
	"--magic": mtg_sets,
	"--canon": mtg_sets
}
for(let k in format_args) {
	let ind = process.argv.indexOf(k);
	if(ind >= 0) {
		for(let i=ind+1; i<process.argv.length; i++) {
			if(process.argv[i].match(/^-/))
				break;
			format_args[k].push(process.argv[i]);
		}
	}
}

delete format_args["--rev"];
delete format_args["--canon"];

prepareFiles();