var geo = null;
var amounts = null;
var j=null;
var margin = {top: 10, right: 20, bottom: 45, left: 70},
		width = 900 - margin.left - margin.right,
		height = 230 - margin.top - margin.bottom;

var formatPercent = d3.format(".1%");

var x = d3.scale.ordinal().rangeRoundBands([0, width], .2);
var y1 = d3.scale.pow().exponent(0.4).range([0, height]);
var y2 = d3.scale.linear().range([0, height]);

var xAxis = d3.svg.axis()
	.scale(x)
	.orient("top");

var yAxis1 = d3.svg.axis()
	.scale(y1)
	.orient("left");
var yAxis2 = d3.svg.axis()
	.scale(y2)
	.orient("left")
	.tickFormat(formatPercent);

var svg = d3.select("#chart").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")") 

var defaultValType=4;

d3.csv("data/school_reg_data.csv", function(data) {
	amounts=data;
	draw();
});	

d3.json("data/geo.json", function(data) {
	geo=data;
	draw();
});

function draw(valType) {
	if ( geo==null || amounts==null)
		return;

	valType = valType===undefined?defaultValType:valType;
	
	maxamount = 0;
	minamount = -1;
	amounts.forEach(function(a) { 
		for (i=0;i<geo.features.length;i++)
			if (geo.features[i].properties.id==a.id) {
				geo.features[i].properties.title=geo.features[i].properties.name+", област "+geo.features[i].properties.oblast;			
				geo.features[i].properties.detska=+a.detska;
				geo.features[i].properties.uchenici=(+a.osnovno)+(+a.gimnaziq);
				if (valType==1)
					geo.features[i].properties.val=geo.features[i].properties.detska;
				else
				if (valType==2)
					geo.features[i].properties.val=geo.features[i].properties.uchenici;
				else
				if (valType==3)
					geo.features[i].properties.val=geo.features[i].properties.detska/geo.features[i].properties.pop;
				else
				if (valType==4)
					geo.features[i].properties.val=geo.features[i].properties.uchenici/geo.features[i].properties.pop;
				else
				if (valType==0)
					geo.features[i].properties.val=geo.features[i].properties.pop;

				if (geo.features[i].properties.val>maxamount && (+a.id!=37 || valType>=3))
					maxamount=geo.features[i].properties.val;
				if (geo.features[i].properties.val<minamount || minamount==-1)
					minamount=geo.features[i].properties.val;
				break;
			}	
	});

	geo.features.sort(function(a,b) { return b.properties.val-a.properties.val; });
	geo.features.forEach(function(f,i) { f.index=i });

	scaleColor=d3.scale.pow().exponent(valType<3?0.3:1.3).domain([minamount,maxamount]);
	scaleColor.domain([0,0.5,1].map(scaleColor.invert));
	scaleColor.range(["#FF0000","#FFCC33","#009900"]);

	valColor = function(feature) {
		if (feature.properties.id==37 && valType<3)
			return "#006600";
		else
		if (feature.properties.val)
			return scaleColor(feature.properties.val);
		else
			return "white";
	};
	

	if (j)
		map.removeLayer(j);
	j=L.geoJson(geo, {
	style: function (feature) {
	        return {fillColor:valColor(feature), 'color':'white', opacity:0.4, fillOpacity:0.5, weight:1};
	},
	onEachFeature: function (feature, layer) {
		if (feature.properties && feature.properties.title) {
			var text = "<h3>"+feature.properties.title+"</h3>"+
				"Население: <b>"+feature.properties.pop+"</b>";
			if (feature.properties.val) {
				text+="<br/>Деца в детски градини: <b>"+feature.properties.detska+" / "+
Math.round(feature.properties.detska/feature.properties.pop*100000)/1000+"%</b>"+
					"<br/>Деца в основно и средно училище: <b>"+feature.properties.uchenici+" / "+
Math.round(feature.properties.uchenici/feature.properties.pop*100000)/1000+"%</b>";
			} else
				text+="<br/>Няма данни";
			layer.bindPopup(text);
			layer.on("mouseover", featureMouseOver);
			layer.on("mouseout", featureMouseOut);

			layer.title=feature.properties.name;
			feature.layer=layer;
		    }
		}
	}).addTo(map);

	var yAxis = valType<3?yAxis1:yAxis2;

	x.domain(geo.features.map(function(f) { return f.properties.title; }));
	yAxis.ticks(8).scale().domain([0,maxamount]);

	svg.selectAll("g").remove();
	svg.selectAll("rect").remove();

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + margin.top + ")")
		.call(xAxis);

	svg.append("g")
		.attr("class", "y axis")
		.attr("transform", "translate(0," + margin.top + ")")
		.call(yAxis)

	var guides = svg.selectAll(".y.axis .tick");
	guides[0].shift();
	guides.append("line")
		.attr("x1",0)
		.attr("x2",width)
		.style("stroke", "#ccc");

	var chartLeft = $("#chart").offset().left;
	var chartRight = chartLeft+width;
	var xticks = $(".x.axis .tick text")
	xticks.each(function(i,o) {
		if (i<xticks.size()*0.15)
			o.style.textAnchor="start";
		else if (i>xticks.size()*0.85)
			o.style.textAnchor="end";
	});

	var a = svg.selectAll(".bar")
		.data(geo.features)
		.enter().append("g")
		.attr("transform", function(f) { return "translate("+x(f.properties.title)+","+(margin.top+2)+")"; });

	a.append("rect")
		.attr("class", "bar")
		.attr("width", x.rangeBand())
		.attr("height", function(f) { return yAxis.scale()(f.properties.val); })
		.style("fill", function(f) { return valColor(f); } )
		.on("mouseover",featureMouseOver)
		.on("mouseout",featureMouseOut)
		.on("click",featureClick);
	a.append("text")
		.attr("class", "bar-val")
		.attr("transform", function(f) { return "translate(0,"+(yAxis.scale()(f.properties.val)+margin.top+5)+")" }) 
		.text(function(f) { return valType<3?f.properties.val:formatPercent(f.properties.val); });
}

function featureMouseOver(o) {
	if (!o)
		return;
	var feature,layer;
	if (o.target) {
		layer=o.target;
		feature=layer.feature;
	} else {
		layer=o.layer;
		feature=o;
	}
	layer.setStyle({opacity:0.8, fillOpacity:0.9}); 
	$(".x.axis .tick").get(feature.index).style.display="inline";
	$(".bar").get(feature.index).style.opacity=.5;
	$(".bar-val").get(feature.index).style.display="inline";
}

function featureMouseOut(o) {
	if (!o)
		return;
	var feature,layer,isMap=o.target;
	if (isMap) {
		layer=o.target;
		feature=layer.feature;
	} else {
		layer=o.layer;
		feature=o;
	}
	if (isMap) {
		layer.setStyle({opacity:0.6, fillOpacity:0.7});
		setTimeout( function() {
			layer.setStyle({opacity:0.4, fillOpacity:0.5});
		}, 100); 
	} else
		layer.setStyle({opacity:0.4, fillOpacity:0.5});
	$(".x.axis .tick").get(feature.index).style.display="";
	$(".bar").get(feature.index).style.opacity="";
	$(".bar-val").get(feature.index).style.display="";
}

function featureClick(o) {
	if (!o)
		return;
	var feature,layer,isMap=o.target;
	if (isMap) {
		layer=o.target;
		feature=layer.feature;
	} else {
		layer=o.layer;
		feature=o;
	}
	if (layer._layers)
		for (var key in layer._layers) {
			layer._layers[key].openPopup();
			break;
		}
	else
		layer.openPopup();
}

L.Control.DataSwitch = L.Control.extend({
	options: {
		collapsed: true,
		position: 'topright',
		autoZIndex: true
	},

	initialize: function (dataValTypes, options) {
		L.setOptions(this, options);

		this._types = dataValTypes;
		this._active = options.default;
	},

	onAdd: function (map) {
		var container=$("<div class='leaflet-control'/>");
		for (var i in this._types)
			$("<div id='switch_"+this._types[i].type+"' class='leaflet-control-layers dataswitch' "+
			(this._active==this._types[i].type?"style='opacity:0.3;'":"")+">"+
			"<img src='" + this._types[i].src + "'"+
			" alt='" + this._types[i].title + "' title='" + this._types[i].title + "'/></div>")	
			.data("type",this._types[i].type)
			.data("control",this)
			.click(function() { 
				draw($(this).data("type")); 
				$(this).fadeTo(200,0.3);
				$("#switch_"+$(this).data("control")._active).fadeTo(200,1);
				$(this).data("control")._active=$(this).data("type");
			})
			.appendTo(container);
		return container.get(0);
	}
});

map = L.map('map', {
		maxBounds:new L.LatLngBounds(new L.LatLng(40.2711, 20.4565),new L.LatLng(45.1123, 30.3442)),
		minZoom:7,
		maxZoom:11,
		fullscreenControl: true,
		fullscreenControlOptions: {
			title:"На цял екран",
			forceSeparateButton:true
		},
		center:new L.LatLng(42.6917, 25.4004),
		zoom:7
	});
map.on('exitFullscreen', function(){
	setTimeout(function() {map.setZoom(7);},500);
});

L.tileLayer('http://{s}.tile.cloudmade.com/ef311d0827c74ca7a2e1bb68614b7ad3/98103/256/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade'
}).addTo(map);

map.addControl(new L.Control.DataSwitch([
	{"title":"Деца в детски градини",src:"res/img/con_kin.png",type:1},
	{"title":"Ученици в начални и средни училища",src:"res/img/con_sch.png",type:2},
	{"title":"Деца в детски градини спрямо населението ",src:"res/img/con_kinperc.png",type:3},
	{"title":"Ученици спрямо населението",src:"res/img/con_schperc.png",type:4},
	{"title":"Население по общини (преброяване 2011)",src:"res/img/con_pop.png",type:0}],
	{"default":4}));
$("div[id^='switch'] img").tipsy({gravity: 'e',fade: true, html:true}); 

