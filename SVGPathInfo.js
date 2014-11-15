
(function(window){
var SVGPathInfo = function(path_elem_OR_path_string){
	
	var commandParameters = {"m": ["x","y"],"l":["x","y"],"t":["x","y"],"h":["x"],"v":["y"],"c":["x1", "y1", "x2", "y2", "x", "y"],"s":["x2", "y2", "x", "y"],"q":["x1", "y1", "x", "y"],"a":["rx", "ry", "x_rot", "arc_flag", "sweep_flag", "x", "y"], "z":[]};
	
	var d = typeof path_elem_OR_path_string === "string"? path_elem_OR_path_string : path_elem_OR_path_string.getAttribute("d"); 
	
	var Command = function(string){
		var type = string.slice(0,1);
		this.type = type; 
		this.string = string;

		var coords = string.slice(1).split(" ");	
		var params = commandParameters[type.toLowerCase()]; 

		for(i=0;i<params.length;i++){

			var this_param = params[i]; 
			this[this_param] = coords[i];
		}
		return this;
	}; 
	
	var ungroupCommands = function(command_string_array){ //takes an array of command-strings, iterates through, ungroups the grouped commands, and returns the corrected (/expanded) array of command-strings 
		var commands = []; 

		command_string_array.forEach(function(command_string){
		var type = command_string[0]; 
		var coords = command_string.slice(1).split(" "); 
		var params = commandParameters[type.toLowerCase()]; 
		if ((params.length > 0) && (coords.length > params.length)) {

			var num = coords.length/params.length;
			for (i=0; i<num; i++){
				var this_command = "";
				for (o=0;o<params.length;o++){
					var index = o + (params.length*i); 
					this_command += coords[index] + " ";  
				}
			commands.push(type + this_command); 
			}
		}
		else commands.push(command_string);  

		}); 
		return commands;
	};
	
	var cleanD = function(str){

		var string = str.replace(/,/g, " "); 
		string = string.replace(/ *([a-zA-Z]) */g, "$1");
		string = string.replace(/(.*) +$/g, "$1");
		string = string.replace(/([0-9])+-/g, "$1 -"); 
		string = string.replace(/ *(a-zA-Z) */g, "$1"); 
		string = string.replace(/ *( ) */g, "$1"); 
		return string; 

	};
	
	var getCommandsArray = function(){ //returns an array of command strings 
		
		var cleand = cleanD(d); 
		var regex_pattern = /[a-zA-Z][0-9 .-]*/g; 
		var matches = cleand.match(regex_pattern);
		
		var command_strings_array = ungroupCommands(matches); 
		return command_strings_array; 	
	};
	
	var parseD = function(){ //creates command objects for each command string 
	
		var commands_array = getCommandsArray(d); 
		var all_commands = {}; 
		var i = 0
		commands_array.forEach(function(string){
			var this_command = new Command(string); 
			all_commands[i] = this_command; //i used `i` because all_commads is an object so it will require an inde
			i++; 		
		});
		return all_commands; 
	};
	

	
	var getCommands = function(){
		return parseD(d); 
	}; 
	
	var getJSON = function(){
		
		var new_commands_object = {}; 
		var pathinfocommands = this.getCommands();
		for (key in pathinfocommands){ 
			// i decided to iterate through the keys rather than directly stringifying `pathinfocommands` so that i can 
			//later choose to add other properties to the command objects, without
			//having to include them in the JSON 
			var this_command_object = pathinfocommands[key];
			new_commands_object[key] = this_command_object; 
		}
		return JSON.stringify(new_commands_object); 	
	}; 
	
	var getSubPaths = function(deep){
		
		var cleand = cleanD(d); 
		var regex_pattern = /[Mm][^Mm]*/g; 
		var matches = cleand.match(regex_pattern);
		
		
		if (deep === true){
			var deep_parsed_array = [];
			matches.forEach(function(string){
				var info = new SVGPathInfo(string);
				deep_parsed_array.push(info.getCommandsArray()); 
			}); 
			return deep_parsed_array; 
		}
		else {
		return matches; 
		}		
	};

	
	
	
	var getRelativePath = function(){
		
		var all_commands = this.getCommands(); 
		var relative_string = ""; 
		var pen = {x:0,y:0}; 
		
		for (key in all_commands){
			var this_command = all_commands[key]; 
			var type = this_command.type; 
			
			var relative = /[a-z]/.test(type)? true : false; 
			if (relative === false){
				//do magic
				relative_string += type.toLowerCase(); 
				for (key in this_command){
					if ((key == "x1")||(key == "x2")||(key == "x")){
						var relative_value = 0;
						relative_value -= pen.x*1;
						relative_value += this_command[key]*1; 
						relative_string += relative_value + " "; 
					}
					else if((key == "y1")||(key == "y2")||(key == "y")){
						var relative_value = 0;
						relative_value -= pen.y*1;
						relative_value += this_command[key]*1; 
						relative_string += relative_value + " ";
					}
					
				}
				if (typeof this_command.x != "undefined") pen.x = this_command.x*1;
				if (typeof this_command.y != "undefined") pen.y = this_command.y*1;
			}
			else {
			
				relative_string += this_command.string; 
				if (typeof this_command.x != "undefined") pen.x += this_command.x*1;
				if (typeof this_command.y != "undefined") pen.y += this_command.y*1;
			}
			
		};
		
		return relative_string;
		
		
	}
	
	var getAbsolutePath = function(){
		
		var all_commands = this.getCommands(); 
		var absolute_string = ""; 
		var pen = {x:0,y:0}; 
		
		for (key in all_commands){
			var this_command = all_commands[key]; 
			var type = this_command.type; 
			
			var relative = /[a-z]/.test(type)? true : false; 
			if (relative === true){
				absolute_string += type.toUpperCase(); 
				for (key in this_command){
					if ((key == "x1")||(key == "x2")||(key == "x")){
						var absolute_value = 0;
						absolute_value += pen.x*1;
						absolute_value += this_command[key]*1; 
						absolute_string += absolute_value + " "; 
					}
					else if((key == "y1")||(key == "y2")||(key == "y")){
						var absolute_value = 0;
						absolute_value += pen.y*1;
						absolute_value += this_command[key]*1; 
						absolute_string += absolute_value + " ";
					}
					
				}
				if (typeof this_command.x != "undefined") pen.x += this_command.x*1;
				if (typeof this_command.y != "undefined") pen.y += this_command.y*1;
			}
			else {
			
				absolute_string += this_command.string; 
				if (typeof this_command.x != "undefined") pen.x = this_command.x*1;
				if (typeof this_command.y != "undefined") pen.y = this_command.y*1;
			}
			
		};
		
		return absolute_string;
	};
	

	
	var getGlobalCubicBezier = function(){
		
		var pen = {x:0,y:0};
		var m = {x:0,y:0}; // last known m, for z commands
		
		var cubic_string = ""; 
		
		var absolute_string = this.getAbsolutePath();  
		var absolute_info_obj = new SVGPathInfo(absolute_string); 
		var all_commands = absolute_info_obj.getCommands(); 
		
		for (key in all_commands){
			var this_command = all_commands[key];
			var type = this_command.type; 
			
			if (type == "A"){
				console.log("Error: conversion of arc commands (\"a\" or \"A\") is not currently supported.")
				return "error"; 
			}
			
			
			if (type == "M") {
				m.x = this_command.x;
				m.y = this_command.y; 
				pen.x = this_command.x;
				pen.y = this_command.y; 
				
				cubic_string += "M" + this_command.x + " " + this_command.y; //m's are not converted 
			}
			else if (type == "C"){
				pen.x = this_command.x;
				pen.y = this_command.y;
				cubic_string += this_command.string; 
			}
			else if (type == "Z"){
				//make a line to m 
				cubic_string += "C" + pen.x + " " + pen.y + " " + m.x + " " + m.y + " " + m.x + " " + m.y; 
				pen.x = m.x;
				pen.y = m.y; 
			}
			else if ((type == "H")||(type == "V")||(type == "L")){
				var x = typeof this_command.x != "undefined"? this_command.x : pen.x; 
				var y = typeof this_command.y != "undefined"? this_command.y : pen.y; 
				
				cubic_string += "C" + pen.x + " " + pen.y + " " + x + " " + y + " " + x + " " + y; 
				
				pen.x = x; 
				pen.y = y; 
			}
			else if (type == "S"){ //shorthand cubic
				var x1 = pen.x; 
				var y1 = pen.y;
				if ((all_commands[key-1].type == "C")||(all_commands[key-1].type == "S")){
					x1 = (2*pen.x) - all_commands[key-1].x2; //the reflection of the previous ctl point relative to the pen location 
					y1 = (2*pen.y) - all_commands[key-1].y2;
				}
				cubic_string += "C" + x1 + " " + y1 + " " + this_command.x2 + " " + this_command.y2 + " " + this_command.x + " " + this_command.y; 
				pen.x = this_command.x;
				pen.y = this_command.y; 
				
			}
			else if ((type == "Q")||(type == "T")){ //quadratic 
				if (type == "T"){
					var x1q = pen.x;
					var y1q = pen.y;
					if ((all_commands[key-1].type == "Q")||(all_commands[key-1].type == "T")){
						x1q = (2*pen.x) - all_commands[key-1].x1; //that T actually does not have a x1 
						y1q = (2*pen.y) - all_commands[key-1].y1; 
					}
					this_command.x1 = x1q; //it's ok to add properties to these command objects because this object was created for getGlobalCubicBezier 
					this_command.y1 = y1q; 
				}
				else {
					var x1q = this_command.x1;
					var y1q = this_command.y1;
				}	
				
				//the first control point
				var x1 = pen.x*1 + ((2/3)*(x1q-pen.x))*1;
				var y1 = pen.y*1 + ((2/3)*(y1q-pen.y))*1; 
				//the second one
				var x2 = this_command.x*1 + ((2/3)*(x1q-this_command.x))*1; 
				var y2 = this_command.y*1 + ((2/3)*(y1q-this_command.y))*1; 
				
				var addthis = "C" + x1 + " " + y1 + " " + x2 + " " + y2 + " " + this_command.x + " " + this_command.y; 
				cubic_string += addthis; 
				
				pen.x = this_command.x;
				pen.y = this_command.y; 
				
			}
			
			
		}; 	
		
		return cubic_string; 
		
	}
	
	this.getJSON = getJSON; 
	this.getCommands = getCommands; 
	this.getCommandsArray = getCommandsArray; 
	this.getSubPaths = getSubPaths;
	this.getRelativePath = getRelativePath; 
	this.getAbsolutePath = getAbsolutePath;
	this.getGlobalCubicBezier = getGlobalCubicBezier; 
	
	return this; 
	
	
}; 
	window.SVGPathInfo = SVGPathInfo; 
	
})(window); 


 
