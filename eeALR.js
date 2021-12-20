/* -----------------------------------------------------------------------------------------------------------------
 ------------------------------------------------------SELECT INPUT PARAMETERS--------------------------------------
--------------------------------------------------------------------------------------------------------------------
*/
// variable name
// one of: 'Surface_Reflectance','Albedo','fAPAR','fCOVER','LAI','CCC','CWC','DASF'
var outputName = 'fCOVER'
// site selection
// one of: 'Geraldton', 'FoxCreek', 'Kouchibouguac', 'Ottawa'
// 'Wabush', 'QueenCharlotte', 'Attawapiskat', 'Eastmain', 'Charlottetown', 'RedBay', 'EaglePlain', 'Kitchener'
var siteSelect = 'Wabush'

/* --------------------------------------------------------------------------------------------------------------
# set parameters based on user-defined parameters above (do not modify)
# ----------------------------------------------------------------------------------------------------------------
*/
var palettes = require('users/gena/packages:palettes');
// palettes for parition layer, should be deprecated
var partitionPalettes = require('users/rfernand387/exports:partitionPalettes');
var partitionMin = ee.Number(0);
var partitionMax = ee.Number(20);

// load modules
var toolsMosaic = require('users/rfernand387/LEAFToolboxModules:toolsMosaic');
var batch = require('users/fitoprincipe/geetools:batch');
var network = require('users/ganghong/ALR:SL2PNetworkv3');
var Utils = require('users/rfernand387/LEAFToolboxModules:toolsUtils');
var Nets = require('users/ganghong/ALR:toolsNets');
var alr = require('users/ganghong/ALR:ALRfunctions');
var NetsUtils = require('users/rfernand387/LEAFToolboxModules:toolsNetsUtils');
var S2 = require('users/rfernand387/LEAFToolboxModules:toolsS2');
var L8 = require('users/rfernand387/LEAFToolboxModules:toolsL8');
var NOW = Date.Now;
var COLLECTION_ID = 'COPERNICUS/S2';
var SECTION_STYLE = { margin: '20px 0 0 0' };

var outputParams = {
	'fAPAR': {
		'outputScale': 1000,
		'outputOffset': 0,
		'outputMax': 1
	},
	'fCOVER': {
		'outputScale': 1000,
		'outputOffset': 0,
		'outputMax': 1
	},
	'LAI': {
		'outputScale': 1000,
		'outputOffset': 0,
		'outputMax': 8
	}
}

var outputScale = outputParams[outputName]['outputScale']
var outputOffset = outputParams[outputName]['outputOffset']
var outputMax = outputParams[outputName]['outputMax']
var responseBand = 'estimate' + outputName

var siteParams = {
	//   # Geraldton, ON
	'Geraldton': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200811T164849_20200811T165525_T16UEA'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-86, 49.5],
			[-86, 50],
			[-85.5, 50],
			[-85.5, 49.5]]]),
		'mapCenter': [-85.75, 49.75]
	},
	// Fox Creek, AB
	'FoxCreek': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20210825T185919_20210825T190431_T11UNA'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-117, 54],
			[-117, 55],
			[-115, 55],
			[-115, 54]]]),
		'mapCenter': [-116.8, 54.4]

	},
	// Kouchibouguac, NB
	'Kouchibouguac': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200905T151701_20200905T151829_T20TLS'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-65, 46],
			[-65, 47],
			[-64, 47],
			[-64, 46]]]),
		'mapCenter': [-64.5, 46.5]
	},
	// Ottawa, ON
	'Ottawa': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200801T155911_20200801T160644_T18TVQ'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-75, 45],
			[-75, 46],
			[-74, 46],
			[-74, 45]]]),
		'mapCenter': [-74.5, 45.5]
	},
	// Wabush, NL
	'Wabush': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200815T153911_20200815T154107_T19UFU'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-67.5, 52.3],
			[-67.5, 53.2],
			[-66.3, 53.2],
			[-66.3, 52.3]]]),
		'mapCenter': [-67, 52.8]
	},
	//Queen Charlotte Island, BC
	'QueenCharlotte': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200909T194951_20200909T195633_T08UPE'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-133, 53.2],
			[-133, 54],
			[-132, 54],
			[-132, 53.2]]]),
		'mapCenter': [-132.4, 53.6]
	},
	// Attawapiskat, ON
	'Attawapiskat': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200815T162839_20200815T163731_T17ULU'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-83, 52.3],
			[-83, 53.2],
			[-82.4, 53.2],
			[-82.4, 52.3]]]),
		'mapCenter': [-82.7, 52.7]
	},
	// # Eastmain, QC
	'Eastmain': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200723T161829_20200723T162656_T17UPT'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-79.5, 51.4],
			[-79.5, 52.3],
			[-78, 52.3],
			[-78, 51.4]]]),
		'mapCenter': [-78.7, 51.8]
	},
	// Charlottetown, PEI
	'Charlottetown': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200622T151659_20200622T151653_T20TMS'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-63.3, 46.1],
			[-63.3, 46.5],
			[-62.9, 46.5],
			[-62.9, 46.1]]]),
		'mapCenter': [-63.1, 46.3]
	},
	// Red Bay, NL
	'RedBay': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200716T145729_20200716T145730_T21UWT'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-56.6, 51.6],
			[-56.6, 52.3],
			[-55.6, 52.3],
			[-56.6, 51.6]]]),
		'mapCenter': [-56, 52]
	},
	// Eagle Plain, YT
	'EaglePlain': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200731T204019_20200731T204021_T08WMU'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-137, 65.75],
			[-137, 66.5],
			[-135, 66.5],
			[-135, 65.75]]]),
		'mapCenter': [-136.3, 66.5]
	},
	// Kitchener, ON
	'Kitchener': {
		'testImage': ee.Image('COPERNICUS/S2/20200615T160911_20200615T161838_T17TNJ'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-81, 43.3],
			[-81, 44],
			[-79.8, 44],
			[-79.8, 43.3]]]),
		'mapCenter': [-80.5, 43.7]
	}
}

var mapBounds = siteParams[siteSelect]['mapBounds']
var mapCenter = siteParams[siteSelect]['mapCenter']
var testImage = siteParams[siteSelect]['testImage']


//other filters
var varmaxCloudcover = 10

// export parameters
var exportFolder = siteSelect + '_' + outputName
var exportDataType = 'int'
var exportScale = 20


var COLLECTION_OPTIONS = {
	// Sentinel 2 using 20 m bands:
	'COPERNICUS/S2_SR': {
		"name": 'COPERNICUS/S2_SR',
		"description": 'Sentinel 2A',
		"Cloudcover": 'CLOUDY_PIXEL_PERCENTAGE',
		"Watercover": 'WATER_PERCENTAGE',
		"sza": 'MEAN_SOLAR_ZENITH_ANGLE',
		"vza": 'MEAN_INCIDENCE_ZENITH_ANGLE_B8A',
		"saa": 'MEAN_SOLAR_AZIMUTH_ANGLE',
		"vaa": 'MEAN_INCIDENCE_AZIMUTH_ANGLE_B8A',
		"VIS_OPTIONS": 'VIS_OPTIONS',
		"Collection_SL2P": ee.FeatureCollection(network.s2_createFeatureCollection_estimates()),
		"Collection_SL2Perrors": ee.FeatureCollection(network.s2_createFeatureCollection_errors()),
		"sl2pDomain": ee.FeatureCollection(network.s2_createFeatureCollection_domains()),
		"Network_Ind": ee.FeatureCollection(network.s2_createFeatureCollection_Network_Ind()),
		"partition": ee.ImageCollection(network.s2_createImageCollection_partition()),
		"legend": ee.FeatureCollection(network.s2_createFeatureCollection_legend()),
		"numVariables": 7
	},
	// Sentinel 2 using 10 m bands:
	'COPERNICUS/S2_SR_10m': {
		"name": 'COPERNICUS/S2_SR',
		"description": 'Sentinel 2A',
		"Cloudcover": 'CLOUDY_PIXEL_PERCENTAGE',
		"Watercover": 'WATER_PERCENTAGE',
		"sza": 'MEAN_SOLAR_ZENITH_ANGLE',
		"vza": 'MEAN_INCIDENCE_ZENITH_ANGLE_B8A',
		"saa": 'MEAN_SOLAR_AZIMUTH_ANGLE',
		"vaa": 'MEAN_INCIDENCE_AZIMUTH_ANGLE_B8A',
		"VIS_OPTIONS": 'VIS_OPTIONS',
		"Collection_SL2P": ee.FeatureCollection(network.s2_10m_createFeatureCollection_estimates()),
		"Collection_SL2Perrors": ee.FeatureCollection(network.s2_10m_createFeatureCollection_errors()),
		"sl2pDomain": ee.FeatureCollection(network.s2_10m_createFeatureCollection_domains()),
		"Network_Ind": ee.FeatureCollection(network.s2_createFeatureCollection_Network_Ind()),
		"partition": ee.ImageCollection(network.s2_createImageCollection_partition()),
		"legend": ee.FeatureCollection(network.s2_createFeatureCollection_legend()),
		"numVariables": 7
	}
}

var VIS_OPTIONS = {
	'fAPAR': {
		"COPERNICUS/S2_SR": {
			"Name": 'fAPAR',
			"errorName": 'errorfAPAR',
			"maskName": 'maskfAPAR',
			"description": 'Fraction of absorbed photosynthetically active radiation',
			"variable": 2,
			"inputBands": ['cosVZA', 'cosSZA', 'cosRAA', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8A', 'B11', 'B12'],
			"inputScaling": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
			"outmin": (ee.Image(ee.Array([[0]]))),
			"outmax": (ee.Image(ee.Array([[1]])))
		},
		"COPERNICUS/S2_SR_10m": {
			"Name": 'fAPAR',
			"errorName": 'errorfAPAR',
			"maskName": 'maskfAPAR',
			"description": 'Fraction of absorbed photosynthetically active radiation',
			"variable": 2,
			"inputBands": ['cosVZA', 'cosSZA', 'cosRAA', 'B2', 'B3', 'B4', 'B8'],
			"inputScaling": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
			"outmin": (ee.Image(ee.Array([[0]]))),
			"outmax": (ee.Image(ee.Array([[1]])))
		}
	},
	'fCOVER': {
		"COPERNICUS/S2_SR": {
			"Name": 'fCOVER',
			"errorName": 'errorfCOVER',
			"maskName": 'maskfCOVER',
			"description": 'Fraction of canopy cover',
			"variable": 3,
			"inputBands": ['cosVZA', 'cosSZA', 'cosRAA', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8A', 'B11', 'B12'],
			"inputScaling": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
			"outmin": (ee.Image(ee.Array([[0]]))),
			"outmax": (ee.Image(ee.Array([[1]])))
		},
		"COPERNICUS/S2_SR_10m": {
			"Name": 'fCOVER',
			"errorName": 'errorfCOVER',
			"maskName": 'maskfCOVER',
			"description": 'Fraction of canopy cover',
			"variable": 3,
			"inputBands": ['cosVZA', 'cosSZA', 'cosRAA', 'B2', 'B3', 'B4', 'B8'],
			"inputScaling": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
			"outmin": (ee.Image(ee.Array([[0]]))),
			"outmax": (ee.Image(ee.Array([[1]])))
		}
	},
	'LAI': {
		"COPERNICUS/S2_SR": {
			"Name": 'LAI',
			"errorName": 'errorLAI',
			"maskName": 'maskLAI',
			"description": 'Leaf area index',
			"variable": 1,
			"inputBands": ['cosVZA', 'cosSZA', 'cosRAA', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8A', 'B11', 'B12'],
			"inputScaling": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
			"outmin": (ee.Image(ee.Array([[0]]))),
			"outmax": (ee.Image(ee.Array([[1]])))
		},
		"COPERNICUS/S2_SR_10m": {
			"Name": 'LAI',
			"errorName": 'errorLAI',
			"maskName": 'maskLAI',
			"description": 'Leaf area index',
			"variable": 1,
			"inputBands": ['cosVZA', 'cosSZA', 'cosRAA', 'B2', 'B3', 'B4', 'B8'],
			"inputScaling": [0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001],
			"outmin": (ee.Image(ee.Array([[0]]))),
			"outmax": (ee.Image(ee.Array([[1]])))
		}
	}
}
// applies a set of shallow networks to an image based on a provided partition image band
var wrapperNNets = function(network, partition, netOptions, colOptions, suffixName, outputName, imageInput) {

	//print('wrappernets')

	// typecast function parameters
	var network = ee.List(network);
	var partition = ee.Image(partition);
	var netOptions = netOptions;
	var colOptions = colOptions;
	var suffixName = suffixName;
	var imageInput = ee.Image(imageInput);
	var outputName = outputName;

	// parse partition  used to identify network to use
	partition = partition.clip(imageInput.geometry()).select(['partition']);

	// determine networks based on collection
	var netList = ee.List(network.get(ee.Number(netOptions.variable).subtract(1)));
	//print(netList);

	// parse land cover into network index and add to input image
	imageInput = imageInput.addBands(Nets.makeIndexLayer(partition, colOptions.legend, colOptions.Network_Ind));
	//print(imageInput);

	// define list of input names
	return (ee.ImageCollection(ee.List.sequence(0, netList.size().subtract(1))
		.map(Nets.selectNet.bind(null, imageInput, netList, netOptions.inputBands))
		.map(Nets.applyNet.bind(null, suffixName + outputName)))
		.max().addBands(partition)).addBands(imageInput.select('networkID'));


};

// convert number to string for mapping onto list
var toString = function(number) {
	return (ee.String(number));
};


/*------------------------------------------------------ SL2P/SL2P10--------------------------------------------------------
-----------------------------SL2P Original (create image and export to drive for use later)---------------------------------
-----------------------------------------------------------------------------------------------------------------------------
*/
// parse the networks
var colName = 'COPERNICUS/S2_SR';
var colOptions = COLLECTION_OPTIONS[colName];
var netOptions = VIS_OPTIONS[outputName][colName];

//var numNets = ee.Number(ee.Feature((COLLECTION_OPTIONS[colName]["Network_Ind"]).first()).propertyNames().remove('Feature Index').remove('system:index').remove('lon').size());
var numNets = ee.Number(ee.Feature(COLLECTION_OPTIONS[colName].Network_Ind.first()).propertyNames().remove('Feature Index').remove('system:index').remove('lon').size());


var SL2P = ee.List.sequence(1, ee.Number(COLLECTION_OPTIONS[colName]["numVariables"]), 1).map(Nets.makeNetVars.bind(null, COLLECTION_OPTIONS[colName].Collection_SL2P, numNets));
//print (SL2P)
var errorsSL2P = ee.List.sequence(1, ee.Number(COLLECTION_OPTIONS[colName]["numVariables"]), 1).map(Nets.makeNetVars.bind(null, COLLECTION_OPTIONS[colName].Collection_SL2Perrors, numNets));

var addDate = function(image) {
	return image.addBands(ee.Image.constant(ee.Date(image.date()).millis().divide(86400000)).rename('date').toUint16())
};

var s2MaskLand = function(image) {
	var mask = (image.select('SCL').eq(4)).or(image.select('SCL').eq(5));
	return (image.updateMask(mask));
};

var s2MaskClear = function(image) {
	var qa = image.select('QA60');
	var mask = qa.bitwiseAnd(1 << 10).eq(0)
		.and(qa.bitwiseAnd(1 << 11).eq(0));
	return (image.updateMask(mask));
};

// add s2 geomtery bands scaled by 10000
var addS2Geometry = function(colOptions, image) {
	return (image.addBands(image.metadata(colOptions.vza).multiply(3.1415).divide(180).cos().multiply(10000).toUint16().rename(['cosVZA']))
		.addBands(image.metadata(colOptions.sza).multiply(3.1415).divide(180).cos().multiply(10000).toUint16().rename(['cosSZA']))
		.addBands(image.metadata(colOptions.saa).subtract(image.metadata(colOptions.vaa)).multiply(3.1415).divide(180).cos().multiply(10000).toInt16().rename(['cosRAA'])));
}

var input_collection = ee.ImageCollection(testImage)
	.map(addDate)
	.map(function(image) { return image.clip(mapBounds) })
	.map(s2MaskClear)
	.map(s2MaskLand)
	.map(addS2Geometry.bind(null, colOptions))

// get partition used to select network
var partition = (COLLECTION_OPTIONS[colName]["partition"]).filterBounds(mapBounds).mosaic().clip(mapBounds).rename('partition')

// pre process input imagery and flag invalid inputs
var scaled_input_collection = input_collection.map(Utils.scaleBands.bind(null, netOptions.inputBands, netOptions.inputScaling))
	.map(Nets.invalidInput.bind(null, colOptions.sl2pDomain, netOptions.inputBands))

//apply networks to produce mapped parameters
var estimateSL2P = scaled_input_collection.map(wrapperNNets.bind(null, SL2P, partition, netOptions, colOptions, 'estimate', outputName))
//print(estimateSL2P)
var uncertaintySL2P = scaled_input_collection.map(wrapperNNets.bind(null, errorsSL2P, partition, netOptions, colOptions, 'error', outputName))
//print(uncertaintySL2P);
//# scale and offset mapped parameter bands
estimateSL2P = estimateSL2P.map(function(image) { return image.addBands(image.select("estimate" + outputName).multiply(ee.Image.constant(outputScale)).add(ee.Image.constant(outputOffset)), null, true) })
uncertaintySL2P = uncertaintySL2P.map(function(image) { return image.addBands(image.select("error" + outputName).multiply(ee.Image.constant(outputScale)).add(ee.Image.constant(outputOffset)), null, true) })
//# produce final export collection
var export_collection = input_collection.combine(estimateSL2P).combine(uncertaintySL2P)

print(export_collection)
//var image_output_names = ([name+"_"+siteSelect+"_"+outputName for name in export_collection.toList(export_collection.size()).map(function(image){return ee.Image(image).id()).getInfo()})])

Map.addLayer(export_collection.mosaic().select('estimate' + outputName), {}, 'estimate' + outputName);
//Map.addLayer(image.select('estimatefCOVER'), { },'image');

var inputImage_bands = ee.List(['B2', 'B3', 'B4', 'B8', 'QA60', 'date', 'estimate' + outputName, 'partition', 'networkID', 'error' + outputName, 'partition_1', 'networkID_1'])
var inputImage = export_collection.first().select(1, 2, 3, 7, 22, 23, 27, 28, 29, 30, 31, 32).rename(inputImage_bands)
print(inputImage)


// Only include VIs that use B2, B3, B4, B8 to create a 10 m product
var input_VI_definition = ee.List([
	//# "RAW_B2  = b('B2')",
	//                         # "RAW_B3  = b('B3')",
	//                       # "RAW_B4  = b('B4')",
	//                     # "RAW_B8  = b('B8')",
	"GI      = b('B3')/b('B4')",
	//                   # "RVI3    = b('B4')/b('B6')",
	//                 # "SR3     = b('B5')/b('B4')",
	//               # "GM1     = b('B6')/b('B3')",
	//             # "GM2     = b('B6')/b('B5')",
	//           # "SR2     = b('B7')/b('B3')",
	//         # "PSSR    = b('B7')/b('B4')",
	"SGI     = b('B8')/b('B4')",
	//       # "MSI     = b('B11')/b('B7')",
	//     # "II      = b('B11')/b('B12')",
	"GVI     = (b('B8')/b('B3'))-1",
	//     # "PSRI    = (b('B4')-b('B3'))/b('B6')",
	"NDVI3   = ((b('B8')-b('B4'))/(b('B8')))+b('B4')",
	//   # "SR5     = 1/b('B5')",
	// # "SR6     = b('B4')/(b('B3')*b('B5'))",
	//# "SR7     = b('B8')/(b('B3')*b('B5'))",
	//# "IPVI    = b('B7')/(b('B7')+b('B4'))",
	//# "ARI     = (1/b('B3'))-(1/b('B5'))",
	//# "ARI2    = b('B7')*((1/b('B3'))-(1/b('B5')))",
	"NDVI    = (b('B8')-b('B4'))/(b('B8')+b('B4'))",
	"GNDVI   = (b('B8')-b('B3'))/(b('B8')+b('B3'))",
	//# "NDWI    = (b('B8')-b('B11'))/(b('B8')+b('B11'))",
	//# "NDREVI  = (b('B8')-b('B5'))/(b('B8')+b('B5'))",
	"NDGI    = (b('B3')-b('B4'))/(b('B3')+b('B4'))",
	//# "NDI1    = (b('B7')-b('B5'))/(b('B7')-b('B4'))",
	//# "NDI2    = (b('B8')-b('B5'))/(b('B8')-b('B4'))",
	//# "RENDVI  = (b('B6')-b('B5'))/(b('B6')+b('B5'))",
	//# "OSAVI   = (1.16*(b('B7')-b('B4')))/(b('B7')+b('B4')+0.61)",
	//    # "NMDI    = (b('B8')-(b('B11')-b('B12')))/(b('B8')+(b('B11')-b('B12')))",
	//   # "HI      = ((b('B3')-b('B5'))/(b('B3')+b('B5')))-0.5*b('B5')",
	//   # "GVSP    = (-0.283*b('B3') - 0.66*b('B4') + 0.577*b('B6') + 0.388*b('B8'))/(0.433*b('B3') - 0.632*b('B4') + 0.586*b('B6') + 0.264*b('B8A'))",
	//   # "MCARI   = ((b('B5')-b('B4'))-0.2*(b('B5')-b('B3')))*(b('B5')/b('B4'))",
	//   # "TCARI   = 3*((b('B5')-b('B4'))-0.2*(b('B5')-b('B3'))*(b('B5')/b('B4')))",
	"EVI     = 2.5*((b('B8')-b('B4'))/(b('B8')+6*b('B4')-7.5*b('B3')+1))",
	"EVI2    = 2.5*((b('B8')-b('B4'))/(b('B8')+2.4*b('B4')+1))",
	"RDVI    = (b('B8')-b('B4'))/((b('B8')+b('B4'))**0.5)",
	"MSR     = ((b('B8')/b('B4'))-1)/((b('B8')/b('B4'))**0.5+1)",
	// # "MSAVI   = 0.5*(2*b('B7')+1-((2*b('B7')+1)**2-8*(b('B7')-b('B4')))**0.5)",
	"MSAVI2  = 0.5*(2*b('B8')+1-((2*b('B8')+1)**2-8*(b('B8')-b('B4')))**0.5)",
	//   # "MCARI2  = (1.5*(2.5*(b('B7')-b('B4'))-1.3*(b('B7')-b('B3'))))/((((2*b('B7')+1)**2)-(6*b('B7')-5*(b('B4')**0.5))-0.5)**0.5)",
	//   # "MTVI2   = (1.5*(1.2*(b('B7')-b('B3'))-2.5*(b('B4')-b('B3'))))/(((2*b('B7')+1)**2-(6*b('B7')-5*b('B4'))-0.5)**0.5)",
	//   # "MSR2    = ((b('B7')/b('B4'))-1)/(((b('B7')/b('B4'))+1)**0.5)",
	"NLI     = ((b('B8')**2)-b('B4'))/((b('B8')**2)+b('B4'))"])

//# names of bands to pass to ALR method (excluding metadata and other non-spectral bands)
var input_bandNames = ['B2', 'B3', 'B4', 'B8', 'GI', 'SGI', 'GVI', 'NDVI3', 'NDVI', 'GNDVI', 'NDGI', 'EVI', 'EVI2', 'RDVI', 'MSR', 'MSAVI2', 'NLI']

//# format image and generate list of selected features
inputImage = alr.format_image(inputImage, inputImage_bands, responseBand, input_VI_definition)
print(inputImage)

//# prepares the image to be ingested by the LARS algorithm
//# returns an image with the response band centred to a mean 0, and the other bands in the image standardized
//# to a mean 0 and standard deviation 1
var scaledImage = alr.scale_image(inputImage, responseBand, mapBounds)
print(scaledImage)

//# apply ALR to the image and obtain the features selected for the model
//# parameters: ee_LARS(inputImage, bandNames, responseBand, numFeatures, numSamples)
var select_features = alr.ee_LARS(scaledImage, input_bandNames, responseBand, 5, 10000, mapBounds)
//print (select_features)

var unclassified = ee.Image(inputImage)
var bands = ee.List([responseBand, 'GI', 'SGI', 'GVI', 'NDVI3', 'NDVI', 'GNDVI', 'NDGI',
	'EVI', 'EVI2', 'RDVI', 'MSR', 'MSAVI2', 'NLI', 'B2', 'B3', 'B4', 'B8',
	'QA60', 'date', 'partition', 'networkID', 'error' + outputName, 'partition_1', 'networkID_1'])
unclassified = unclassified.rename(bands)

//# prediction bands (equivalent to select_features, with responseBand)
bands = select_features
var input_bands = select_features.add(responseBand)

//# GET TRAINING DATASET
//# Feature Vector (table) used to train regression model (select only prediction bands)
var training_data = ee.FeatureCollection(unclassified.sample({ region: mapBounds, numPixels: 1000, seed: 1 }).select(input_bands))

//# CREATE CLASSIFIERS

//# implement regression tree with Random Forest algorithm
//# optional parameters for smileRandomForest(): numberOfTrees, variablesPerSplit, minLeafPopulation, bagFraction, maxNodes, seed
var rf_classifier = ee.Classifier.smileRandomForest(100).setOutputMode('REGRESSION').train({
	features: training_data,
	classProperty: responseBand,
	inputProperties: input_bands
})

//# implement regression tree with CART (Classification and Regression Tree) algorithm
//# optional parameters for smileCart(): maxNodes, minLeafPopulation
var cart_classifier = ee.Classifier.smileCart().setOutputMode('REGRESSION').train({
	features: training_data,
	classProperty: responseBand,
	inputProperties: input_bands
})

//                                                                       # CLASSIFY IMAGE
var rf_classified = unclassified.select(bands).classify(rf_classifier, 'rf_' + responseBand).clip(mapBounds)
var cart_classified = unclassified.select(bands).classify(cart_classifier, 'cart_' + responseBand).clip(mapBounds)


//# CHECK RESULTS (CROSS-VALIDATION)
var joined_image = unclassified.select(responseBand).addBands(rf_classified.select('rf_' + responseBand)).addBands(cart_classified.select('cart_' + responseBand))

//# using same random seed as training_data, get 2000 samples and discard the first 1000, leaving 1000 different samples for cross-validation
//# this sampling method ensures no overlap between training and testing datasets
var joined_samples = ee.FeatureCollection(joined_image.sample({ region: mapBounds, numPixels: 2000, seed: 1 }).toList(2000, 1000))
//print (joined_samples)

/*------------------------------------------------------------------------------------------------------------
------------------------------------------------------Export results------------------------------------------
--------------------------------------------------------------------------------------------------------------
*/
/*Export.table.toDrive({
collection: joined_samples,
  description: siteSelect+'_'+outputName+'_regression_tree2',
fileFormat: 'CSV'
});

Export.image.toAsset({image:rf_classified ,
					  description : siteSelect+'_'+outputName+'_rf_10m2',
					  assetId : "users/ganghong/ALR/",
					  region : mapBounds,
					  scale :10,
					  maxPixels :1e13})
*/
//Map.addLayer(inputImage.select('estimate'+outputName), { },'estimate0'+outputName);
//# scale image responseBand for export (was multiplied by 1000 for previous steps, so rescale before proceeding)


/*------------------------------------------------------------------------------------------------------------
--------------------------------Preparing NNET (Tensorflow)---------------------------------------------------
--------------------------------------------------------------------------------------------------------------
*/

inputImage = inputImage.addBands(inputImage.select(responseBand).divide(1000), null, true)
//
//# Create the export task on the server side from Earth Engine. Remember that the data will be exported to the google drive of the google
//# account you used when you initiated the Earth Engine API authentication flow, so ensure that, that accounts drive is synced to the 
//# gdrive folder in the same folder as this script
var trimmedCollection = alr.trim_data(inputImage.updateMask(inputImage.select(responseBand).gt(0)),
	select_features,
	responseBand,
	50000,
	10)//, mapBounds)
print(trimmedCollection)
