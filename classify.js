#!/usr/bin/env node

var path = require('path'),
	// the following come from package.json
	classifier = require('classifier'),
	csv = require('csv'),
	inquirer = require('inquirer');
	//_ = require('underscore');

function rel_path(file) {
	var parts = file.split('/');
	parts.unshift(__dirname);
	return path.resolve.apply(path, parts);
}

function classify(data) {
	if (data.length === 0) {
		console.log("All done!");
		return;
	}

	var datum = data.pop()[config.data_column_index];

	console.log(datum);

	bayes.classify(datum, function (classification) {
		inquirer.prompt({
			type: 'input',
			message: 'Classification:',
			name: 'classification',
			default: classification
		}, function (answers) {
			// TODO re-training doesn't seem to work
			if (classification != answers.classification) {
				bayes.train(datum, answers.classification);
			}

			console.log("");

			classify(data);
		});
	});
}

function summarize(data, summary) {
	if (data.length === 0) {
		console.log("All done!");
		console.log(summary);
		return;
	}

	summary = summary || {};

	bayes.classify(data.pop()[config.data_column_index], function (classification) {
		if (summary.hasOwnProperty(classification)) {
			summary[classification]++;
		} else {
			summary[classification] = 1;
		}

		summarize(data, summary);
	});
}

var config = require(rel_path('config.js'));

var bayes = new classifier.Bayesian({
	backend: {
		type: 'Redis',
		options: {
			name: path.basename(config.csv_file).replace(/\.csv$/, '')
		}
	}
});

var cb = (process.argv[2] == 'show' ? summarize : classify);
csv().from.path(rel_path(config.csv_file)).to.array(function (data) { cb(data); });
