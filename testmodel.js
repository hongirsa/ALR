
var image = ee.Image("users/ganghong/ALR/20200622T151659_20200622T151653_T20TMS_Charlottetown_LAI");

//# Point to the model hosted on AI Platform.  If you specified a region other
//# than the default (us-central1) at model creation, specify it here.
var MODEL_NAME = 'ALR_model'
var VERSION_NAME='alrKerasV1'
var REGION = 'northamerica-northeast1'
var PROJECT = 'ccmeo-ag-000008'

var model_alr = ee.Model.fromAiPlatformPredictor({
    projectName:PROJECT,
    modelName:MODEL_NAME,
    version:VERSION_NAME,
    region:REGION,
  //  # Can be anything, but don't make it too big.
    inputTileSize:[8,8],
    //# Keep this the same as your training data.
    proj:ee.Projection('EPSG:4326').atScale(10),
    fixInputProj:true,
    //# Note the names here need to match what you specified in the
    //# output dictionary you passed to the EEifier.
    outputBands:{'output': {
        'type': ee.PixelType.float(),
        'dimensions': 1
      }
    }
  })
print (model_alr)

// variable name
var assetfolder="users/ganghong/ALR/"   /// modify this asset folder first
// one of: 'Surface_Reflectance','Albedo','fAPAR','fCOVER','LAI','CCC','CWC','DASF'
var outputName = 'LAI'
// site selection
// one of: 'Geraldton', 'FoxCreek', 'Kouchibouguac', 'Ottawa'
// 'Wabush', 'QueenCharlotte', 'Attawapiskat', 'Eastmain', 'Charlottetown', 'RedBay', 'EaglePlain', 'Kitchener'
var siteSelect = 'Charlottetown'

var siteParams = {
	
	// Charlottetown, PEI
	'Charlottetown': {
		'testImage': ee.Image('COPERNICUS/S2_SR/20200622T151659_20200622T151653_T20TMS'),
		'mapBounds': ee.Geometry.Polygon(
			[[[-63.3, 46.1],
			[-63.3, 46.5],
			[-62.9, 46.5],
			[-62.9, 46.1]]]),
		'mapCenter': [-63.1, 46.3]
	}
}

var mapBounds = siteParams[siteSelect]['mapBounds']
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

var alr = require('users/ganghong/ALR:ALRfunctions');
var NetsUtils = require('users/rfernand387/LEAFToolboxModules:toolsNetsUtils');

var NOW = Date.Now;
var COLLECTION_ID = 'COPERNICUS/S2';

var responseBand = 'estimate' + outputName

//var inputImage_bands = ee.List(['B2', 'B3', 'B4', 'B8', 'QA60', 'date', 'estimate' + outputName, 'partition', 'networkID', 'error' + outputName, 'partition_1', 'networkID_1'])
//var inputImage = export_collection.first().select(1, 2, 3, 7, 22, 23, 27, 28, 29, 30, 31, 32).rename(inputImage_bands)
//print(inputImage)

// Only include VIs that use B2, B3, B4, B8 to create a 10 m product
var input_VI_definition = ee.List([
	
	"GI      = b('B3')/b('B4')",
	"SGI     = b('B8')/b('B4')",
	"GVI     = (b('B8')/b('B3'))-1",
	"NDVI3   = ((b('B8')-b('B4'))/(b('B8')))+b('B4')",
	"NDVI    = (b('B8')-b('B4'))/(b('B8')+b('B4'))",
	"GNDVI   = (b('B8')-b('B3'))/(b('B8')+b('B3'))",
	"NDGI    = (b('B3')-b('B4'))/(b('B3')+b('B4'))",
	"EVI     = 2.5*((b('B8')-b('B4'))/(b('B8')+6*b('B4')-7.5*b('B3')+1))",
	"EVI2    = 2.5*((b('B8')-b('B4'))/(b('B8')+2.4*b('B4')+1))",
	"RDVI    = (b('B8')-b('B4'))/((b('B8')+b('B4'))**0.5)",
	"MSR     = ((b('B8')/b('B4'))-1)/((b('B8')/b('B4'))**0.5+1)",
	"MSAVI2  = 0.5*(2*b('B8')+1-((2*b('B8')+1)**2-8*(b('B8')-b('B4')))**0.5)",
	"NLI     = ((b('B8')**2)-b('B4'))/((b('B8')**2)+b('B4'))"])


//var inputImage = ee.Image(assetfolder+'/'+image_output_names[0]).select(1,2,3,7,22,23,27,28,29,30,31,32)
var inputImage = image.select(1,2,3,7,22,23,27,28,29,30,31,32)
//# names of bands to pass to ALR method (excluding metadata and other non-spectral bands)
var input_bandNames = ['B2', 'B3', 'B4', 'B8', 'GI', 'SGI', 'GVI', 'NDVI3', 'NDVI', 'GNDVI', 'NDGI', 'EVI', 'EVI2', 'RDVI', 'MSR', 'MSAVI2', 'NLI']
var inputImage_bands = ee.List(['B2', 'B3', 'B4', 'B8', 'QA60', 'date', 'estimate'+outputName, 'partition', 'networkID', 'error'+outputName, 'partition_1', 'networkID_1'])
//# format image and generate list of selected features
inputImage = alr.format_image(inputImage, inputImage_bands, responseBand, input_VI_definition)
//print(inputImage)

//# prepares the image to be ingested by the LARS algorithm
//# returns an image with the response band centred to a mean 0, and the other bands in the image standardized
//# to a mean 0 and standard deviation 1
var scaledImage = alr.scale_image(inputImage, responseBand, mapBounds)
//print(scaledImage)

//# apply ALR to the image and obtain the features selected for the model
//# parameters: ee_LARS(inputImage, bandNames, responseBand, numFeatures, numSamples)
var select_features = alr.ee_LARS(scaledImage, input_bandNames, responseBand, 5, 10000, mapBounds)
//print (select_features)

//# # Turn into an array image for input to the model.
var array_image = inputImage.select(select_features).float().toArray()
print (array_image, 'image to array')

var predictions = model_alr.predictImage(array_image)
print (predictions,'predicted image')

Map.addLayer(ee.Image(predictions),{},'Prediction');
