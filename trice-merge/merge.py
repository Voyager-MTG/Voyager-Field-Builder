import os, shutil, xml.etree.ElementTree as XET, re

TOKENMATCHES = {
	"Can Be Cast From Exile EXPT": "(play|cast) ([^\n.]+ (from exile|exiled)|(one of )?those cards|them|it this turn|it until)",
	"Embraced Cards AKT": "(E|e)mbrace",
	"Liberated Dragon AKT": "(L|l)iberate",
	"Trace Reminder VNM": "(C|c)reate (a|two|three|four|five|X) trace(s?) of",
	"Vertex Reminder PVR": "{V",
	"Luminous VNM": "(L|l)uminous",
	"Reserves HOD": "(I|i)n your reserves",
	"~ Token WAW": "Reflect {[0-9WUBRGIXYZ]+?}",
	"~ ITD": "Iterate"
}

def copytree(src, dst, symlinks=False, ignore=None):
	for item in os.listdir(src):
		s = os.path.join(src, item)
		d = os.path.join(dst, item)
		if os.path.isdir(s):
			# print("copying", s, d)
			shutil.copytree(s, d, symlinks, ignore)
		else:
			shutil.copy2(s, d)

def liststr(l):
	s = ""
	for i in l:
		if i != None:
			s += i
	return s

print("Initializing...")

try:
	shutil.rmtree("export")
	shutil.rmtree("temp")
except:
	pass

# time.sleep(3)

try:
	os.mkdir("export")
	os.mkdir("export/pics")
	os.mkdir("export/pics/tokens")
	os.mkdir("temp")
except:
	print("Directory already exists")

copytree("sets", "temp")
# time.sleep(3)

sets_text = ""
cards_text = ""
tokens_text = ""
out_text_cards = ""
out_text_tokens = ""
uuid = 0

def isBasicLand(name):
	return "Plains" in name or "Island" in name or "Swamp" in name or "Mountain" in name or "Forest" in name or "Faitlt" in name

for set_file_path in os.listdir('temp'): # Loop through the temp folder
	# Initialize variables
	set_name = ""
	set_folder = False
	if set_file_path[-4:] == ".xml": # if it ends in .xml, make the set name the part before .xml
		set_name = set_file_path.split(".xml")[0]
	else: # otherwise split it by -files and set the set_folder bool to true
		set_name = set_file_path.split("-files")[0]
		set_folder = True

	set_xml = not set_folder # set a bool telling us if we're in a set xml file

	if set_xml: # If we're in an xml
		with open(f"temp/{set_file_path}", "r", encoding="utf-8") as f: # open up the xml and read the text
			xml_text = f.read()
		
		set_card_text = "<cards>" + (xml_text.split("<cards>"))[1].split("</cards>")[0] + "</cards>"

		root = XET.fromstring(set_card_text)
		for card in root:
			name = card[0].text
			set = card[1].text
			rar = card[1].attrib["rarity"]
			num = card[1].attrib["num"]
			if isBasicLand(name):
				set_card_text = set_card_text.replace(f'<name>{name}</name>\n      <set num="{num}" rarity="{rar}">{set}</set>', f'<name>{name}</name>\n	  <set num="{num}" rarity="" uuid="{uuid}">{set}</set>')
			set_card_text = set_card_text.replace(f'<name>{name}</name>\n      <set num="{num}" rarity="{rar}">{set}</set>', f'<name>{name}</name>\n	  <set num="{num}" rarity="{rar}" uuid="{uuid}">{set}</set>')
			uuid += 1

		set_card_text = set_card_text.replace("<cards>", "").replace("</cards>", "")

		sets_text += (xml_text.split("<sets>"))[1].split("</sets>")[0]  # add the sets to sets_text
		cards_text += set_card_text  # add the cards to cards_text
	else: # If we're in a folder
		with open(f"temp/{set_file_path}/{set_name} Tokens.xml", "r", encoding="utf-8") as f:
			xml_text = f.read()  # open up the tokens xml and read the text
		
		tokens_text += (xml_text.split("<cards>"))[1].split("</cards>")[0] # get the card text and put it into tokens_text
		
		os.rename(f"temp/{set_file_path}", f"export/pics/{set_name}")

	print(f"Parsed {set_file_path}")


cards_xml = open('export/cards.xml', 'w+', encoding = "utf-8")
tokens_xml = open('export/tokens.xml', 'w+', encoding = "utf-8")

out_text_cards += """<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_carddatabase version="4">
  <sets>
"""
out_text_cards += sets_text

out_text_cards += """
  </sets>
  <cards>
"""

out_text_cards += cards_text

out_text_cards += """</cards>
</cockatrice_carddatabase>
"""

cards_xml.write(out_text_cards)

out_text_tokens += """<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_carddatabase version="4">
  <cards>
"""

out_text_tokens += tokens_text

out_text_tokens += """</cards>
</cockatrice_carddatabase>
"""

cards_root = XET.parse("export/cards.xml").getroot()
tokens_root = XET.fromstring(out_text_tokens)

def englishToNumber(s):
	n = 1

	if "one" == s or "a" == s or "an" == s:
		n = 1
	elif "two" == s:
		n = 2
	elif "three" == s:
		n = 3
	elif "four" == s:
		n = 4
	elif "five" == s:
		n = 5
	elif "six" == s:
		n = 6
	elif "seven" == s:
		n = 7
	elif "eight" == s:
		n = 8
	elif "nine" == s:
		n = 9
	elif "ten" == s:
		n = 10
	elif "eleven" == s:
		n = 11
	elif "twelve" == s:
		n = 12
	elif "thirteen" == s:
		n = 13
	elif "fourteen" == s:
		n = 14
	elif "fifteen" == s:
		n = 15
	elif "sixteen" == s:
		n = 16
	elif "seventeen" == s:
		n = 17
	elif "eighteen" == s:
		n = 18
	elif "nineteen" == s:
		n = 19
	elif "twenty" == s:
		n = 20
	elif "x" in s or "that many" in s or "a number" in s:
		n = "x"

	return n

def getCount(n):
	if n != 1:
		return f"count=\"{n}\""
	else:
		return ""

def getSubtype(typ):
	if "-" in typ:
		return typ.split("-")[1].strip()
	else:
		return ""
	
def convertColors(c):
	s = ""
	colormap = {
		"white" : "W",
		"blue"  : "U",
		"black" : "B",
		"red"   : "R",
		"green" : "G",
		"silver": "I",
	}
	for k, v in colormap.items():
		s += v if k in c else ""
	
	return s if s else None

def getToken(type = None, colors = None, pt = None, set = None):
	if type == "" and colors == "":
		return None

	possible_tokens = []
	for card_ in tokens_root[0]:
		card = {}
		for property in card_:
			if property.tag == "prop":
				for prop in property:
					card[prop.tag] = prop.text
			else:
				card[property.tag] = property.text

		type_eq   = type   == None or str(type).strip() == str(getSubtype(card.get("type")))
		colors_eq = colors == None or str(card["colors"]).strip() == str(convertColors(colors))
		pt_eq	 = pt	 == None or str(card.get("pt")) == str(pt).strip()
		
		if (type_eq and colors_eq and pt_eq and set == card["set"]):
			return card["name"]
		elif (type_eq and colors_eq and pt_eq):
			possible_tokens.append(card["name"])

	return possible_tokens[0] if possible_tokens else None


def tokenPuller(card):
	global out_text_tokens
	big_match = re.findall(r'creates? [^.]+', card["text"], flags=re.I)
	if big_match and not "!noscript" in card["notes"]:
		for phrase in big_match:
			token_regex = re.compile("[C|c]reate (X|X plus one|a number of|that many|a|an|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)( tapped| goaded)?( and attacking)?( legendary)?( basic)?( snow)? ?([XYZ0-9]+/[XYZ0-9]+ )?(colorless|white|blue|black|red|green|silver)?(, (?:white|blue|black|red|green|silver),)?( and white| and blue| and black| and red| and green| and silver)? ?([A-Z][a-z]+)?( [A-Z][a-z]+)?( [A-Z][a-z]+)? ?(enchantment )?(artifact )?(land )?(creature )?tokens?( (with|named|that[’']s|that is|that are|attached|that can't block) [^\n.]+)?")
			tokens = token_regex.search(phrase)
			if tokens:
				tokenMatch = tokens.groups()
				token_type = liststr(tokenMatch[10:13])
				count = englishToNumber(tokenMatch[0])
				token_to_script = getToken(token_type, liststr(tokenMatch[7:10]), tokenMatch[6], card["set"])
				if token_type == "":
					token_name = re.findall("[N|n]amed (.*?) (with|that)", str(tokenMatch[17]))
					if token_name:
						token_to_script = token_name[0][0] + " " + card["set"]
						out_text_tokens = out_text_tokens.replace(f"<name>{token_to_script}</name>", f"<name>{token_to_script}</name>\n	  <reverse-related {getCount(count)}>{card["name"]}</reverse-related>")
				else: 
					out_text_tokens = out_text_tokens.replace(f"<name>{token_to_script}</name>", f"<name>{token_to_script}</name>\n	  <reverse-related {getCount(count)}>{card["name"]}</reverse-related>")
	
	# Manual Scripts
	
				   

print("Building tokens...")
for card_ in cards_root[1]:
	card = {}
	for property in card_:
		if property.tag == "prop":
			for prop in property:
				card[prop.tag] = prop.text
		else:
			card[property.tag] = property.text

	if not card.get("notes"):
		card["notes"] = ""
		
	if not card.get("name"):
		card["name"] = ""

	if card["text"]: 
		tokenPuller(card)

	for token, exp in TOKENMATCHES.items():
		if not card["text"] or card["text"] == None or card["text"] == "":
			continue

		token = token.replace("~", card["name"])
		token = token.replace("CARDNAME", card["name"])
		# token = token.replace("CARDTYPE", card["type"])
		token = token.replace("CARDSET" , card["set" ])
		
		if re.findall(exp, card["text"]):
			out_text_tokens = out_text_tokens.replace(f"<name>{token}</name>", f"<name>{token}</name>\n	  <reverse-related>{card["name"]}</reverse-related>")

tokens_xml.write(out_text_tokens)

tokens_xml.close()
cards_xml.close()

try:
	shutil.rmtree("temp")
except:
	pass

print("Done!")