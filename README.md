# Active Learning Regularization (ALR)-Sentinel2

Details on ALR using SL2P algorithm: https://www.sciencedirect.com/science/article/pii/S0034425720306143 
LEAF-Toolbox: https://github.com/rfernand387/LEAF-Toolbox
Jupyter lab notebook with Python3 source code for LEAF-Toolbox using Google Earth Engine Python API.

## Files:
3_regression_approaches_kate_finalversion_updated.ipynb:  updated version of https://github.com/hongirsa/Sentinel2_ALR/blob/main/code/3_regression_approaches.ipynb

eeALR.js:  the exact above version implemented in Google Earth Engine, the plot components have been removed. 

## Environment configuration:
You will need an Anaconda environment configured as:

Anaconda

conda create --name leaftoolbox

conda activate leaftoolbox

conda install -c conda-forge jupyterlab -y

conda install -c conda-forge earthengine-api -y

conda install -c conda-forge folium -y

conda install -c conda-forge matplotlib -y

conda install -c conda-forge pandas -y

conda install -c conda-forge scikit-learn -y

conda install -c conda-forge scipy -y

conda install -c conda-forge tensorflow -y

Then as follows to run the script in terminal window:

conda activate leaftoolbox

jupyter lab
