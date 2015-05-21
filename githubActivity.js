var gh = {};

gh.languageMap = {
    "coffee": "CoffeeScript",
    "js": "JavaScript",
    "py": "Python"
};

gh.Language = {
    view: function (ctrl, data) {
        return m(".language", [
            m(".name", data.name),
            m(".changes", data.changes)
        ]);
    }
};

gh.ChangedFile = function (data) {
    this.changes = m.prop(data.changes);
    this.language = m.prop(
        gh.languageMap[data.filename.split(".")[1]] || "Other");
};

gh.Commit = function (data) {
    this.changedFiles = data.files.map(function (file) {
        console.log(file);
        return gh.ChangedFile(file);
    });
};

gh.Event = function (data) {
    this.type = m.prop(data.type);

    this.commits = data.payload.commits ? data.payload.commits.map(function (commitData) {
        return m.request({
            method: "GET",
            url: commitData.url,
            type: gh.Commit
        });
    }) : m.prop([]);
};

gh.Event.list = function () {
    return m.request({
        method: "GET",
        url: "https://api.github.com/users/grigoryk/events",
        type: gh.Event
    });
};

gh.vm = {
    init: function () {
        gh.vm.events = gh.Event.list();
        gh.vm.languages = gh.vm.events.map(function (event) {
            return event.commits().map(function (commit) {
                return commit.changedFiles();
            });
        });
    }
};

gh.controller = function () {
    gh.vm.init();
};

gh.view = function (ctrl) {
    return m(".languages", [
        m.component(gh.Language, {name: "Python", changes: 197})
    ]);
};

m.mount(
    document.getElementById("githubActivity"),
    {
        controller: gh.controller,
        view: gh.view
    }
);