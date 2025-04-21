import os, shutil, xml.etree.ElementTree as XET, regex

TOKENMATCHES = {
    "Can Be Cast From Exile EXPT": "(play|cast) ([^\n.]+ (from exile|exiled)|(one of )?those cards|them|it this turn|it until)",
    "Embraced Cards AKT": "(E|e)mbrace",
    "Trace Reminder VNM": "(C|c)reate (a|two|three|four|five|X) trace",
    "Vertex Reminder PVR": "{V",
    "Luminous VNM": "(L|l)uminous",
    "Reserves HOD": "(I|i)n your reserves"
}


try:
    shutil.rmtree("export")
except:
    pass

# time.sleep(3)

try:
    os.mkdir("export")
    os.mkdir("export/pics")
    os.mkdir("export/pics/tokens")
except:
    print("Directory already exists")

# time.sleep(3)

sets_text = ""
cards_text = ""
tokens_text = ""
out_text_cards = ""
out_text_tokens = ""

for set_file_path in os.listdir('sets'): # Loop through the sets folder
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
        with open(f"sets/{set_file_path}", "r", encoding="utf-8") as f: # open up the xml and read the text
            xml_text = f.read()
        
        sets_text += (xml_text.split("<sets>"))[1].split("</sets>")[0]  # add the sets to sets_text
        cards_text += (xml_text.split("<cards>"))[1].split("</cards>")[0]  # add the cards to cards_text
    else: # If we're in a folder
        with open(f"sets/{set_file_path}/{set_name} Tokens.xml", "r", encoding="utf-8") as f:
            xml_text = f.read()  # open up the tokens xml and read the text
        
        root = XET.fromstring(xml_text)

        for card in root[0]:
            card_name = card[0].text
            card_rules_text = card[4].text
            try:
                os.rename(f"sets/{set_name}-files/{card_name}.jpg", f"export/pics/tokens/{card_name} {set_name}.jpg")
            except:
                print(f"token not found (sets/{set_name}-files/{card_name}.jpg)")
        
        xml_text = xml_text.replace("</name>", f" {set_name}</name>") # add the set name suffix to the end of each token
        tokens_text += (xml_text.split("<cards>"))[1].split("</cards>")[0] # get the card text and put it into tokens_text
        
        os.rename(f"sets/{set_file_path}", f"export/pics/{set_name}")

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
# cards_xml.close()

out_text_tokens += """<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_carddatabase version="4">
  <cards>
"""

# print(tokens_text)
out_text_tokens += tokens_text

out_text_tokens += """</cards>
</cockatrice_carddatabase>
"""

cards_root = XET.parse("export/cards.xml").getroot()

# print()

print("Parsing reminders")
for card in cards_root[1]:
    rules_text = ""
    card_name = ""
    for property in card:
        if property.tag == "text":
            rules_text = property.text
        elif property.tag == "name":
            card_name = property.text

    for token, exp in TOKENMATCHES.items():
        # print(exp, rules_text)
        if not rules_text or rules_text == None or rules_text == "":
            continue
        # print("looking", regex.findall(exp, rules_text))
        if regex.findall(exp, rules_text):
            out_text_tokens = out_text_tokens.replace(f"<name>{token}</name>", f"<name>{token}</name>\n      <reverse-related>{card_name}</reverse-related>")
            # print(out_text_tokens)

tokens_xml.write(out_text_tokens)

tokens_xml.close()
cards_xml.close()

print("Done!")