import { parse } from 'csv-parse/sync';

const brandCSV = `Brand Id,Brand Name,Type,Created,Brand Code,Has Baseline?,BaselineId,Visual,Aroma,Taste,Mouthfeel,Overall
b-1,Test Brand,beer,1/1/2026,123,true,,amber,piney,bitter,full,good
`;

const evalCSV = `Test Id,Panel Start,Panel End,Panel Name,Brand Id,Brand Name,Brand Code,Flavor Map,Batch,Sample Id,Blind?,Tags,User,Name,Rating Date,Value,Preference,Comment
t-1,1/1/2026,1/1/2026,My Panel,b-1,Test Brand,123,beer,BATCH1,,no,,user@test.com,User 1,1/1/2026,6,Like,Good
`;

const trainCSV = `Tasting Id,Panel Name,User,Name,Rating Date,Attribute,Intensity,Picked,Passed
tr-1,Training Panel,user@test.com,User 1,1/1/2026,Diacetyl,3,Diacetyl,yes
`;

function splitCSVLine(line: string): string[] {
	const result: string[] = [];
	let inQuotes = false;
	let cell = '';
	for (let i = 0; i < line.length; i++) {
	  const char = line[i];
	  if (char === '"') {
		if (inQuotes && line[i + 1] === '"') {
		  cell += '"';
		  i++;
		} else {
		  inQuotes = !inQuotes;
		}
	  } else if (char === ',' && !inQuotes) {
		result.push(cell.trim());
		cell = '';
	  } else {
		cell += char;
	  }
	}
	result.push(cell.trim());
	return result;
}

const lines = trainCSV.split('\n');
console.log("Training:");
console.log(lines[0]);
console.log(lines[0].toLowerCase().includes('tasting id'));
console.log(lines[0].toLowerCase().includes('attribute'));
console.log(lines[0].toLowerCase().includes('passed'));

