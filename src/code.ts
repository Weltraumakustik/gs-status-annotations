//vars
let uiWidth = 260 // default ui width
let uiHeight = 300; // default ui height
let spacing = 16; // spacing of annotations from top of frame
let updateCount = 0;
let removeCount = 0;

cleanUp();

if (figma.command === 'refresh') {
	cleanUp();
	figma.closePlugin();
} else {
	//show the UI of the plugin
	figma.showUI(__html__, {width: uiWidth, height: uiHeight });
}

//recieves msgs from the UI
figma.ui.onmessage = msg => {

	switch(msg.type){

		case 'height':
			uiHeight = msg.height;
			figma.ui.resize(uiWidth, uiHeight);
		break;

		case 'addStatus':
			let status:object = msg.status;
			createAnnotations(status);
		break;

		case 'delete':
			deleteSelected();
		break;

		case 'deleteAll':
			deleteAll();
		break;

		case 'refresh':
			cleanUp();
		break;

	} 

};




//function to get frames within the selection
function getTopLevelNodes(nodes) {
	let topLevelNodesInSelection = [];
	if (nodes) {
		nodes.forEach(node => {
			if (node.parent === figma.currentPage) {
				if (node.type === 'COMPONENT' || node.type === 'FRAME' || node.type === 'INSTANCE' || node.type === 'GROUP') {
					topLevelNodesInSelection.push(node);
					console.log(topLevelNodesInSelection)
				}
			}
		});
	}
	return topLevelNodesInSelection as SceneNode[];
}

//create specified annotation
async function createAnnotations(status) {

	let selection:SceneNode[] = getTopLevelNodes(figma.currentPage.selection);

	if (selection.length !== 0) {

		//counter
		let count = 0;

		//create the frame with auto layout
		let annotionFrame = figma.createFrame();
		annotionFrame.counterAxisSizingMode = 'AUTO';
		annotionFrame.layoutMode = 'HORIZONTAL';
		annotionFrame.itemSpacing = 12;
		annotionFrame.horizontalPadding = 16;
		annotionFrame.verticalPadding = 12;
		annotionFrame.name = 'annotation';
		annotionFrame.topLeftRadius = 4;
		annotionFrame.topRightRadius = 4;

		//style the stroke
		annotionFrame.strokes = [{
			type: 'SOLID',
			visible: true,
			opacity: 1,
			blendMode: 'NORMAL',
			color: hexToFigmaRgb(status.color)
		}];
		annotionFrame.strokeWeight = 4;
		

		//create and style the text node
		let text = figma.createText();
		text.name = status.title;

		//define and load the font
		let fontName = {
			'family': 'Inter',
			'style': 'Semi Bold'
		}
		await figma.loadFontAsync(fontName);

		//apply the font properties to the text node
		text.fontName = fontName;
		text.fontSize = 20;
		text.lineHeight = {
			'value': 24,
			'unit': 'PIXELS'
		}

		//add text to the text node
		var today = new Date();

		var date = today.getDate()+'.'+(today.getMonth()+1)+'.'+today.getFullYear();
		let statusText = status.icon + ' ' + status.title +' – '+ (date);
		text.characters = statusText;

		//create the icon
		let icon = figma.createText();
		icon.name = status.icon;
		icon.layoutAlign = 'CENTER';

			//apply the font properties to the text node
			icon.fontName = fontName;
			icon.fontSize = 20;
			icon.lineHeight = {
				'value': 24,
				'unit': 'PIXELS'
			}

		//add icon and text to annotation
		annotionFrame.insertChild(0,text);
		 annotionFrame.insertChild(1,icon);

		//group the frame and put it into an array
		let itemsToGroup = [];
		itemsToGroup.push(annotionFrame);
		let annotation = figma.group(itemsToGroup, figma.currentPage);
		annotation.name = status.title;

		//create the inner shadow
		let innerShadowColor = hexToFigmaRgb(status.color);
		innerShadowColor = Object.assign({a: 1.0}, innerShadowColor);
		annotation.effects = [{
			blendMode: 'NORMAL',
			color: innerShadowColor,
			offset: {x: 0, y: -4},
			radius: 0,
			type: 'INNER_SHADOW',
			visible: true
		}];

//ABEL	//create the Border frame with auto layout
		let annotationBorder = figma.createFrame();
		annotationBorder.name = 'border';
		annotationBorder.resizeWithoutConstraints(101, 101);

//ABEL	//style the stroke
		annotationBorder.strokes = [{
			type: 'SOLID',
			visible: true,
			opacity: 1,
			blendMode: 'NORMAL',
			color: hexToFigmaRgb(status.color),
		}];
		annotationBorder.strokeWeight = 2;
		
//ABEL	//style frame background
		function clone(val) {
			return JSON.parse(JSON.stringify(val))
		  }
		const fills = clone(annotationBorder.fills);
		fills[0].opacity = 0;
		annotationBorder.fills = fills;
		//annotationBorder.fills[0].opacity = 0;

//ABEL	//put the border into an array
		let border = annotationBorder;
		border.name = "status_border";

		//loop through each frame
		selection.forEach(node => {

			let statusAnnotation;
			let statusBorder;

			//remove existing status if there is one
			removeStatus(node);
			
			//check to see if first annotation
			if (count === 0) {
				statusAnnotation = annotation;
				statusBorder = border;
			} else {
				statusAnnotation = annotation.clone();
				statusBorder = border.clone();
			}

			//get the frame id
			let nodeId:string = node.id;

			//set the position of the annotation
			let y = node.y - statusAnnotation.height - spacing;
			let x = (node.x + node.width) - statusAnnotation.width;
			statusAnnotation.x = x;
			statusAnnotation.y = y;

			//move border into parent frame
			node.appendChild(statusBorder);


//ABEL		//set the position of the border
			statusBorder.x = 0;
			statusBorder.y = 0;
			statusBorder.locked = true;

//ABEL		//set the size of the border
			statusBorder.resize(node.width, node.height);

			//add meta data to the annotation
			statusAnnotation.setPluginData('frameId',nodeId);
			statusBorder.setPluginData('frameId',nodeId);

			//add to group with annotations or create one
			let annotationGroup = figma.currentPage.findOne(x => x.type === 'GROUP' && x.name === 'status_annotations') as GroupNode;
			if (annotationGroup) {
				annotationGroup.appendChild(statusAnnotation);
				annotationGroup.parent.insertChild(0, annotationGroup);
			} else {
				let annotationsToGroup = [];
				annotationsToGroup.push(statusAnnotation);
				let newAnnotationGroup = figma.group(annotationsToGroup, figma.currentPage);
				newAnnotationGroup.name = 'status_annotations';
				newAnnotationGroup.locked = true;
				newAnnotationGroup.expanded = false;
				newAnnotationGroup.parent.insertChild(0, newAnnotationGroup);
			}

			//set plugin relaunch data
			if (node.type != 'INSTANCE') {
				node.setRelaunchData({ status: status.title });
			}
			node.setSharedPluginData('statusannotations', 'status', status.title);

			//add plugin relaunch data to the page
			figma.currentPage.setRelaunchData({ refresh: '' });

			//increase the counter
			count++;
		});
		//send success notification
		figma.notify('✅ Status set: ' + status.title);
	} else {
		figma.notify('Please select a top level frame, component, or group');
	}
}

//clears the status on selected frames
function deleteSelected() {
	let selection:SceneNode[] = getTopLevelNodes(figma.currentPage.selection);
	if (selection.length !== 0) {
		selection.forEach(node => {
			removeStatus(node);
			if (node.type != 'INSTANCE') {
				node.setRelaunchData({ });
			}
		});
		if (removeCount === 1) {
			figma.notify('🚫 1 annotation removed')
		} else if (removeCount > 1) {
			figma.notify(removeCount + ' annotations removed')
		}

	} else {
		figma.notify('👋 Please select a frame, component, or group with a status')
	}
	removeCount = 0;
}

//clear all annotations
function deleteAll() {
	let annotationGroup = figma.currentPage.findOne(x => x.type === 'GROUP' && x.name === 'status_annotations') as GroupNode;
	let allAnnotationBorders = figma.currentPage.findAll(x => x.type === 'FRAME' && x.name === 'status_border');
	
	if (annotationGroup) {
		annotationGroup.remove();
		allAnnotationBorders.forEach(node => {
			node.remove();
		});
	}

	//need to make this more performant
	let topLevelNodes:SceneNode[] = getTopLevelNodes(figma.currentPage.children);
	topLevelNodes.forEach(node => {
		if (node.type != 'INSTANCE') {
			node.setRelaunchData({ });
		}
	})

	// //remove the plugin relaunch button
	// figma.currentPage.setRelaunchData({ });

	//notify the user
	figma.notify('🚫 All annotations removed');
}

//remove the status msg from a frame
function removeStatus(frame) {

	let targetId = frame.id;
	let annotationGroup = figma.currentPage.findOne(x => x.type === 'GROUP' && x.name === 'status_annotations') as GroupNode;
	let allAnnotationBorders = figma.currentPage.findAll(x => x.type === 'FRAME' && x.name === 'status_border');

	//remove shared plugin data`
	frame.setSharedPluginData('statusannotations', 'status', '');

	if (annotationGroup) {
		annotationGroup.children.forEach(annotation => {
			let refId = annotation.getPluginData('frameId');
			if (targetId === refId) {
				annotation.remove();
				removeCount++;
			}
		})
		allAnnotationBorders.forEach(border => {
			let refId = border.getPluginData('frameId');
			if (targetId === refId) {
				border.remove();
			}
		});
	}
}

//this function removes unused annotations and also updates the position
function cleanUp() {
	let annotationGroup = figma.currentPage.findOne(x => x.type === 'GROUP' && x.name === 'status_annotations') as GroupNode;
	if (annotationGroup) {
		annotationGroup.children.forEach(annotation => {
			let refId = annotation.getPluginData('frameId');
			let node = figma.getNodeById(refId) as SceneNode;
			if (node) {
				let y = node.y - annotation.height - spacing;
				let x = (node.x + node.width) - annotation.width;

				if (annotation.x != x && annotation.y != y) {
					updateCount++
				}

				annotation.x = x;
				annotation.y = y;
			} else {
				annotation.remove();
				updateCount++
			}
		});

		//talk to the user
		if (updateCount === 1) {
			figma.notify('1 annotation updated')
		} else if (updateCount > 1) {
			figma.notify(updateCount + ' annotations updated')
		}

		//move the annotations to the bottom
		annotationGroup.parent.insertChild(0, annotationGroup);
	}
	updateCount = 0;
}

//Helper Functions

//hex to figma color system
function hexToFigmaRgb(hex:string) {
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? {
	  r: (parseInt(result[1], 16))/255,
	  g: (parseInt(result[2], 16))/255,
	  b: (parseInt(result[3], 16))/255
	} : null;
}