# field-builder

field-builder depends on Jimp 
> npm i jimp

## Using field-builder
First, use the magic-field-test exporter on MSE sets to get a folder of images and a txt of LackeyBot data for their cards. The names of these don't matter, as long as the pair stays consistent as "example.txt" and "/example" or "example.txt" and "/example-files".

Set codes used per set should be unique, as Cockatrice and LackeyBot can't properly tell them apart otherwise. During the formatting step, LackeyBot will add a number to duplicate set codes it finds.

Add all the exported files and folders to "/X Pool" folders within the "/files" folder, then run `node field-builder` or `node field-builder --noimages`. file-builder will attempt to crunch the files into LackeyBot and Cockatrice data. If successful, and run without `--noimages`, it will then rename the images to the Cockatrice names and split DFCs.

If successful, field-builder will output `cards.xml`, `tokens.xml`, and the `/pics/` folders to the `final` folder, so the entire folder can be added to Cockatrice's `/data` folder. It also writes  `cards.json`, `setData.json`, `pools.json` in the `lbfiles` folder to be used for LackeyBot.

## Pulling extra sets
MSEM, Revolution, and Canon sets can also be added to the install with command line arguments. These ping the LackeyBot API for set/card data, and don't write images; the Card Sources links should be used for these.

Add Storytime from MSEM:
> node field-builder --msem 101

Add Blood Like Rivers from Revolution and March of the Machine and MOM: Aftermath:
> node field-builder --rev BLR --canon MOM MAT