Charts and data on schools in Bulgaria
============

Demo
------

http://opendata.yurukov.net/educ/map/

Motivation
------

A map and a bar chart show the distribution of kids in schools and kindergartens accross regions in Bulgaria. There are several indicators to choose from:
* kids in kindergarten
* pupils in schools
* kids in kindergarten as % of the population
* pupils in schools as % of the population
* population

The data was collected from the published reports of the Bulgarian Ministry of Education and Science:
http://mon.bg/left_menu/budget/

Code
------

The map is built with Leaflet.js using custom CloudMade tiles. The region overlay is loaded from a geoJSON description of Bulgaria extracted from the OpenStreetMap definitions. The bar chart, data and color handling is done with D3.js. I've build event handlers and data update mechanism to link the Leaflet map and the d3 chart.
