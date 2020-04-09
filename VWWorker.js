/*
 VWWorker.js
 The script class is used for creating a separate thread for processing the input like. Converting the raw data in more THREE relevant data. Though the worker consumes and generates strings or JSON. The data will be near to THREE.js relevant data which will be easier for conversion
*/
"use strict";
             
self.VWUtil = function(){
	this.createMeshMaterial = function(inObject) {
		var outMeshMaterial = new Object();
		outMeshMaterial.fMeshtype = inObject.mTy;
		if (inObject.mTy == 0){
			outMeshMaterial.fObjectColor = inObject.mOCo;
			outMeshMaterial.fMaterialID = inObject.mMID;
			outMeshMaterial.fbRepeatU = (inObject.mRH === 1);
			outMeshMaterial.fbRepeatV = (inObject.mRV === 1);
		}
		else if (inObject.mTy == 2){
			outMeshMaterial.fObjectColor = inObject.mOCo;
			outMeshMaterial.fLineWeight = parseFloat(inObject.mOCo);
			outMeshMaterial.fMaterialID = inObject.mMID;
			outMeshMaterial.fMaterialType = parseInt(inObject.mMTy);
			outMeshMaterial.fOrigin = inObject.mOr;
			outMeshMaterial.fIAxisPt = inObject.mIAx;
			outMeshMaterial.fJAxisPt = inObject.mJAx;
			outMeshMaterial.fIsRepeated = (inObject.mRe.trim() === "1");
			outMeshMaterial.fbIsMirrored = (inObject.mMi.trim() === "1");
			outMeshMaterial.fbIsFlipped = (inObject.mFli.trim() === "1");
			outMeshMaterial.fConsistentUVFlow = inObject.mUVFl;
			outMeshMaterial.fPattern = inObject.mPat;
			outMeshMaterial.fBackgroundColor = inObject.mBCo;
			outMeshMaterial.fTextWorldHeight = parseFloat(inObject.mTeH);
		}
		
		return outMeshMaterial;
	};
	this.createGeometry = function(newObject) {
		var baseGeometry = newObject.message.objectData.fMeshDataArray;
		var mergedBasedGeometries = [];
		var bsGeomNode = baseGeometry.shift();
		var bIsHatch = false;
		while(bsGeomNode) {
			if (bsGeomNode.fIndices !== undefined) {
			bsGeomNode.fIndices = bsGeomNode.fIndices.replace(/,$/, '');
			bsGeomNode.fIndices = this.convertStringToArray(bsGeomNode.fIndices,',');
			}
			bsGeomNode.fVertices = bsGeomNode.fVertices.replace(/,$/, '');
			if (bsGeomNode.fVertices !== undefined)
			bsGeomNode.fVertices = this.convertStringToArray(bsGeomNode.fVertices,',');
			if (bsGeomNode.fNormals !== undefined) {
				bsGeomNode.fNormals = bsGeomNode.fNormals.replace(/,$/, '');
				bsGeomNode.fNormals = this.convertStringToArray(bsGeomNode.fNormals,',');
			}
			bsGeomNode.fUVs = bsGeomNode.fUVs.replace(/,$/, '');
			if (bsGeomNode.fUVs !== undefined)
			bsGeomNode.fUVs = this.convertStringToArray(bsGeomNode.fUVs,',');
			if (bsGeomNode.fMeshMaterial.fMeshMat.fMeshType != 5) {
				if (bsGeomNode.fMeshMaterial.fMeshMat.fObjectColor !== undefined)
					bsGeomNode.fMeshMaterial.fMeshMat.fObjectColor = this.convertStringToArray(bsGeomNode.fMeshMaterial.fMeshMat.fObjectColor,' ');
				if (bsGeomNode.fMeshMaterial.fMeshMat.fMeshType == 2) {
					bsGeomNode.fMeshMaterial.fMeshMat.fIAxisPt = this.convertStringToArray(bsGeomNode.fMeshMaterial.fMeshMat.fIAxisPt,' ');
					bsGeomNode.fMeshMaterial.fMeshMat.fJAxisPt = this.convertStringToArray(bsGeomNode.fMeshMaterial.fMeshMat.fJAxisPt,' ');
					bsGeomNode.fMeshMaterial.fMeshMat.fOrigin = this.convertStringToArray(bsGeomNode.fMeshMaterial.fMeshMat.fOrigin,' ');
					bsGeomNode.fMeshMaterial.fMeshMat.fBackgroundColor = this.convertStringToArray(bsGeomNode.fMeshMaterial.fMeshMat.fBackgroundColor,' ');
				}
			}
				
			var found = false;
			for(var i = 0; i < mergedBasedGeometries.length; ++i) {
				if(mergedBasedGeometries[i].materialId === bsGeomNode.fMeshMaterial.fMeshMat.fMaterialID && this.areColorsIdentical(mergedBasedGeometries[i].objectColor, objectColor)) {
					this.mergeBufferGeometry(mergedBasedGeometries[i].geometry,bsGeomNode);
					found = true;
					break;
				}
			}
			if(!found) {
				if (bsGeomNode.fMeshMaterial.fMeshMat.fMeshType == 2 && bsGeomNode.fMeshMaterial.fMeshMat.fMaterialType == 7) {
					bsGeomNode.fMeshMaterial.fMeshMat.fMaterialType = 0;
					bIsHatch = true;
				}
				else if (bIsHatch)
					bsGeomNode.fMeshMaterial.fMeshMat.fMaterialType = 7;
				mergedBasedGeometries.push({meshMat:bsGeomNode.fMeshMaterial.fMeshMat, geometry:bsGeomNode});
			}
			
			bsGeomNode = baseGeometry.shift();
		};
		
		var instances = newObject.message.objectData.fInstances;
		var instanceNode = instances.shift();
		var instanceId = 0;
		while(instanceNode) {
			var tranformedGeometryList = [];
			var transferableArrays = [];
			//var tm = this.convertStringToArray(instanceNode.fTransform,',');
			var tm = instanceNode.fTransform.map(Number);
			for(var i = 0; i < mergedBasedGeometries.length; ++i) {
				if (mergedBasedGeometries[i].geometry.fVertices === undefined)
					continue;
				else {
					var transformedGeometry = this.transformGeometry(mergedBasedGeometries[i].geometry,tm, mergedBasedGeometries[i].meshMat);
				transferableArrays.push(transformedGeometry.Vertices.buffer);
					if (transformedGeometry.Face)
				transferableArrays.push(transformedGeometry.Face.buffer);
				if(transformedGeometry.TextureCoord)
					transferableArrays.push(transformedGeometry.TextureCoord.buffer);
					if(transformedGeometry.Normal)
					transferableArrays.push(transformedGeometry.Normal.buffer);
				tranformedGeometryList.push({
					meshMat : mergedBasedGeometries[i].meshMat, 
					geometry : transformedGeometry,
					flags : mergedBasedGeometries[i].geometry.fMeshFlags
				});
			}
			}
			
			var transferableObjects = {
				visibility : instanceNode.fVisibility,
				instanceId : instanceId++,
				objectId : newObject.message.objectData.fObjectId,
				transform : tm,
				geometry : tranformedGeometryList
			}
			self.postMessage({workerId:newObject.workerId,type:'geometryLoaded',processedModel:transferableObjects,success:true, boundingBox:newObject.message.objectData.BB,completed:false},transferableArrays);
			
			instanceNode = instances.shift();
		}
		self.postMessage({type : 'geometryLoaded', completed:true});
	};
	
	this.createGeometry2 = function (newObject) {
		var baseGeometry = newObject.message.objectData.m;
		var mergedBasedGeometries = [];
		var bIsHatch = false;
		for(var key in baseGeometry) {
			var bsGeomNode = baseGeometry[key];
			//console.log(bsGeomNode);
			if (bsGeomNode.mF !== undefined) {
				bsGeomNode.fIndices = bsGeomNode.mF.replace(/,$/, '');
				bsGeomNode.fIndices = this.convertStringToArray(bsGeomNode.fIndices,',');
			}
			
			if (bsGeomNode.mV !== undefined){
				bsGeomNode.fVertices = bsGeomNode.mV.replace(/,$/, '');
				bsGeomNode.fVertices = this.convertStringToArray(bsGeomNode.fVertices,',');
			}
			
			if (bsGeomNode.mN !== undefined) {
				bsGeomNode.fNormals = bsGeomNode.mN.replace(/,$/, '');
				bsGeomNode.fNormals = this.convertStringToArray(bsGeomNode.fNormals,',');
			}

			if (bsGeomNode.mUV !== undefined) {
				bsGeomNode.fUVs = bsGeomNode.mUV.replace(/,$/, '');
				bsGeomNode.fUVs = this.convertStringToArray(bsGeomNode.fUVs,',');
			}
			if (bsGeomNode.mTy != 5) {
				if (bsGeomNode.mOCo !== undefined){
					bsGeomNode.mOCo = this.convertStringToArray(bsGeomNode.mOCo,',');
				}
				if (bsGeomNode.mTy == 2) {
					bsGeomNode.mIAx = this.convertStringToArray(bsGeomNode.mIAx,',');
					bsGeomNode.mJAx = this.convertStringToArray(bsGeomNode.mJAx,',');
					bsGeomNode.mOr = this.convertStringToArray(bsGeomNode.mOr,',');
					bsGeomNode.mBCo = this.convertStringToArray(bsGeomNode.mBCo,',');
					bsGeomNode.mUVFl = this.convertStringToArray(bsGeomNode.mUVFl,',');
					bsGeomNode.mPat = this.convertStringToArray(bsGeomNode.mPat,',');
				}
			}
				
			var found = false;
			for(var i = 0; i < mergedBasedGeometries.length; ++i) {
				if(mergedBasedGeometries[i].mMID === bsGeomNode.mMID) {
					this.mergeBufferGeometry(mergedBasedGeometries[i].geometry,bsGeomNode);
					found = true;
					break;
				}
			}
			if(!found) {
				if (bsGeomNode.mMID == 2 && bsGeomNode.mMTy == 7) {
					bsGeomNode.mMTy = 0;
					bIsHatch = true;
				}
				else if (bIsHatch)
					bsGeomNode.mMTy = 7;
				mergedBasedGeometries.push({geometry:bsGeomNode});
			}
		};
		
		var instances = newObject.message.objectData.i;
		var instanceId = 0;
		for(var key in instances) {
			var instanceNode = instances[key];
			var tranformedGeometryList = [];
			var transferableArrays = [];
			var tm = instanceNode.iTr.replace(/,$/, '');
			tm = this.convertStringToArray(tm,',');
			for(var i = 0; i < mergedBasedGeometries.length; ++i) {
				if (mergedBasedGeometries[i].geometry.fVertices === undefined)
					continue;
				else {
					var meshMat = this.createMeshMaterial(mergedBasedGeometries[i].geometry);
					var transformedGeometry = this.transformGeometry(mergedBasedGeometries[i].geometry,tm, meshMat);
					transferableArrays.push(transformedGeometry.Vertices.buffer);
						if (transformedGeometry.Face)
					transferableArrays.push(transformedGeometry.Face.buffer);
					if(transformedGeometry.TextureCoord)
						transferableArrays.push(transformedGeometry.TextureCoord.buffer);
					if(transformedGeometry.Normal)
						transferableArrays.push(transformedGeometry.Normal.buffer);
					tranformedGeometryList.push({
						meshMat : meshMat, 
						geometry : transformedGeometry,
						flags : mergedBasedGeometries[i].geometry.mFla
					});
				}
			}
			
			var transferableObjects = {
				visibility : instanceNode.iVi,
				instanceId : instanceId++,
				objectId : newObject.message.objectData.oId,
				transform : tm,
				geometry : tranformedGeometryList
			}
			self.postMessage({workerId:newObject.workerId,type:'geometryLoaded',processedModel:transferableObjects,success:true, boundingBox:newObject.message.objectData.BB,completed:false},transferableArrays);		
		}
		self.postMessage({type : 'geometryLoaded', completed:true});
	}

	// Convert the string to required data type.
	this.convertStringToArray = function (string, delimiter){
		var result = undefined;  
		if(string !== undefined && string.length > 0){
			result = string.split(delimiter).map(Number);
		}
		return result;
	}

	this.areColorsIdentical = function(inColorA, inColorB) {
		if (inColorA[0] === inColorA[0] && inColorA[1] === inColorB[1] && inColorA[2] === inColorB[2] && inColorA[3] === inColorB[3])
			return true;
		else
			return false;
	};
	
	this.transformGeometry = function(geometry , matrix, meshMat) {
		var newGeometry = {
			Vertices : (geometry.fVertices)?new Float32Array(geometry.fVertices):undefined,
			Normal : (geometry.fNormals && meshMat.fMeshType == 5)?new Float32Array(geometry.fNormals):undefined,
			TextureCoord : (geometry.fUVs)?new Float32Array(geometry.fUVs):undefined,
			Face : geometry.fIndices?new Uint16Array(geometry.fIndices):undefined,
		};
		if (newGeometry.Vertices) {
		var vertexLength = newGeometry.Vertices.length;
		for(var i = 0; i < vertexLength ; i+=3) {
			var modVertex = applyMatrix4(newGeometry.Vertices[i],newGeometry.Vertices[i+1],newGeometry.Vertices[i+2],matrix);
			newGeometry.Vertices[i] = modVertex[0];
			newGeometry.Vertices[i+1] = modVertex[1];
			newGeometry.Vertices[i+2] = modVertex[2];
		}
		}
		/*
		if(newGeometry.Normal) {
			var normalLength = newGeometry.Normal.length;
			for(var i = 0; i < normalLength ; i+=3) {
				// get the normal matrix here. Then apply the matrices;
				var modNormal = applyMatrix4(newGeometry.Normal[i],newGeometry.Normal[i+1],Normal.Vertices[i+2],matrix);
				newGeometry.Normal[i] = modNormal[0];
				newGeometry.Normal[i+1] = modNormal[1];
				newGeometry.Normal[i+2] = modNormal[2];
			}
		}
		*/
		
		return newGeometry;
		
		function applyMatrix4( ox,oy,oz,m ) {

			var x = ox, y = oy, z = oz;

			ox = m[ 0 ] * x + m[ 4 ] * y + m[ 8 ]  * z + m[ 12 ];
			oy = m[ 1 ] * x + m[ 5 ] * y + m[ 9 ]  * z + m[ 13 ];
			oz = m[ 2 ] * x + m[ 6 ] * y + m[ 10 ] * z + m[ 14 ];
			var w =  m[ 3 ] * x + m[ 7 ] * y + m[ 11 ] * z + m[ 15 ];

			return divideScalar( ox,oy,oz,w );

		}
		function multiplyScalar( ox,oy,oz,scalar ) {

			if ( isFinite( scalar ) ) {
				ox *= scalar;
				oy *= scalar;
				oz *= scalar;
			} else {
				ox = 0;
				oy = 0;
				oz = 0;
			}
			return [ox,oy,oz];
		}
		
		function divideScalar( ox,oy,oz,scalar ) {
			return multiplyScalar( ox,oy,oz,1 / scalar );
		}
	};
	
	this.mergeBufferGeometry = function(geometry1,geometry2){
		if(!geometry1.fIndices || !geometry1.fVertices || !geometry2.fIndices || !geometry2.fVertices) {
			console.log("Invalid geometry objects for merging");
			return -1;
		}
			
		// Merging arrays into parent array. 	
		for ( var key in geometry1 ) {
			if(key === "fIndices" && geometry2[key] !== undefined) {
				var offset = geometry1.fVertices.length/3;
				var geom2FaceLength = geometry2[ key ].length;
				for( var i = 0, il = geom2FaceLength; i < il; i++ ) {
					geometry2[ key ][i] = offset + geometry2[ key ][i];
				}
				geometry1[ key ] = Uint32ArrayConcat( geometry1[ key ], geometry2[ key ] );
			}
			else if ( (key === "fVertices" || key === "fNormals" || key === "fUVs") && geometry2[ key ] !== undefined && geometry2[key].length > 0 ) {
				geometry1[ key ] = Float32ArrayConcat( geometry1[ key ], geometry2[ key ] );
			}
		}

		return geometry1;

		/***
		 * @param {Float32Array} first
		 * @param {Float32Array} second
		 * @returns {Float32Array}
		 * @constructor
		 */
		function Float32ArrayConcat(first, second)
		{
			var result = new Float32Array(first.length + second.length);
			result.set(first);
			result.set(second, first.length);
			return result;
		}

		/**
		 * @param {Uint32Array} first
		 * @param {Uint32Array} second
		 * @returns {Uint32Array}
		 * @constructor
		 */
		function Uint32ArrayConcat(first, second)
		{
			var result = new Uint32Array(first.length + second.length);
			result.set(first);
			result.set(second, first.length);
			return result;
		}
	};
	/*this.createNewStream = function(inStream) {
		self.postMessage({workerId:inStream.workerId,type:'insertCustomStream',processedObject:inStream,success:true, completed:false});
		self.postMessage({type : 'insertCustomStream', completed:true});
	};
	this.createNewCamera = function(inCamera) {
		self.postMessage({workerId:inCamera.workerId,type:'insertCamera',processedObject:inCamera,success:true, completed:false});
		self.postMessage({type : 'insertCamera', completed:true});
	};*/
};

var util = new VWUtil();
self.onmessage = function(event) {
	var type = event.data.message.type;
	switch(type) {
		case 'newObject' : util.createGeometry(event.data);
		break;
		case 'newObject2' : util.createGeometry2(event.data);
		break;
		case 'mergeGeometry' : {
			var objectData = event.data.message.objectData;
			var mergedGeometry = util.mergeGeometries(objectData.baseGeometry,objectData.newGeometry);
			if(mergedGeometry)
				self.postMessage({workerId:event.data.workerId,type:'geometryMerged',meshId:event.data.message.objectData.meshId,processedModel:mergedGeometry.toJSON(),success:true});
			else
				self.postMessage({workerId:event.data.workerId,type:'geometryMerged',data:"Could not merge the geometries.",success:false});
		}
		break;
		default:self.postMessage({
			data:"Invalid request for processing",success:false
		});
		break;
	}
}





