ko.bindingHandlers.hidden = {
    update: function(element, valueAccessor) {
        var isVisible = !ko.utils.unwrapObservable(valueAccessor());
        ko.bindingHandlers.visible.update(element, function() { return isVisible; });
    }        
};

ko.bindingHandlers.clickToEdit = {
    init: function(element, valueAccessor) {
        var observable = valueAccessor(),
            link = document.createElement("a"),
            input = document.createElement("textarea")

        element.appendChild(link)
        element.appendChild(input)

        observable.editing = ko.observable(false)
        ko.applyBindingsToNode(link, {
            text: observable,
            hidden: observable.editing,
            click: function() {
                observable.editing(true);
            },
            clickBubble: false
        });

        ko.applyBindingsToNode(input, {
            value: observable,
            visible: observable.editing,
            hasfocus: observable.editing
        });
    }
};

function getJsonpData(url, callback) {
    var sep = url.indexOf('?') >= 0 ? '&' : '?';
    $.ajax({type: "GET",
            url: 'http://tools.tntp.org/jira/' + url + sep + 'jsonp-callback=' + callback,
            contentType: "application/javascript; charset=utf-8",
            dataType: "jsonp"});
}

$(document).ready(function() {
    getJsonpData('rest/api/2/project/TNEX/versions', 'versionsFetched');
});
  
var viewModel = function(data) {
    var _this = this;
    this.loading = ko.observable(false);
    this.showSelector = ko.observable(false);
    this.versions = data;
    this.selectedVersion = ko.observable();
    this.selectedVersionName = ko.computed(function() {
        return this.selectedVersion() ? this.selectedVersion().name : "";
    }, this);
    this.selectedVersion.subscribe(function(newValue) {
        vm.issues([]);
        vm.loading(true);
        getJsonpData('rest/api/2/search?jql=fixVersion=' + newValue.id, 'issuesFetched');
    });
    this.issues = ko.observableArray();
    this.selectedIssues = ko.observableArray();
}

var vm;

var versionsFetched = function(data){
    vm = new viewModel(data);
    ko.applyBindings(vm);
}

var issuesFetched = function(data) {
    $.each(data.issues, function(index, issue) {
        getJsonpData('rest/api/2/issue/' + issue.key, 'issueDetailsFetched');
    });
}

var issueDetailsFetched = function(data) {
    vm.issues.push({
        key: data.key,
        summary: data.fields.summary,
        points: ko.observable(data.fields.customfield_10041),
        date: ko.observable(''),
        developer: ko.observable(''),
        qa: ko.observable(''),
        // ideally we'd get this from the data, for now it's just defaulted to false
        isBuffer: ko.observable(false),
        toggleBufferClass: function(data, event) {
          data.isBuffer(!data.isBuffer());
        }
    });
    vm.loading(false);
    vm.showSelector(true);
}
