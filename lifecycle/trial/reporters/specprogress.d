module trial.reporters.specprogress;

import std.stdio;
import std.array;
import std.conv;
import std.datetime;
import std.algorithm;

import trial.interfaces;
import trial.reporters.writer;
import trial.reporters.stats;
import trial.reporters.spec;

class SpecProgressReporter : SpecReporter, ISuiteLifecycleListener {
  private {
    alias UpdateFunction = void delegate(CueInfo info);

    struct CueInfo {
      string id;
      string name;
      long duration;
      SysTime begin;
    }

    ulong oldTextLength;
    StatStorage storage;
    string[] path;

    CueInfo[] cues;
  }

  this(StatStorage storage) {
    super();
    this.storage = storage;
    writer.writeln("");
  }

  this(ReportWriter writer, StatStorage storage) {
    super(writer);
    this.storage = storage;
    writer.writeln("");
  }

  void clearProgress() {
    writer.goTo(1);
    writer.write("\n" ~ " ".replicate(oldTextLength));
    writer.goTo(1);
    oldTextLength = 0;
  }

  void update() {
    auto now = Clock.currTime;
    auto progress = cues.map!(cue => "*[" ~ (cue.duration - (now - cue.begin).total!"seconds").to!string ~ "s]" ~ cue.name).join(" ").to!string;

    auto spaces = "";

    if(oldTextLength > progress.length) {
      spaces = " ".replicate(oldTextLength - progress.length);
    }

    writer.goTo(1);
    writer.write("\n" ~ progress ~ spaces);

    oldTextLength = progress.length;
  }

  void removeCue(string id) {
    cues = cues.filter!(a => a.id != id).array;
  }

  void begin(ref SuiteResult suite) {
    auto stat = storage.find(suite.name);
    auto duration = (stat.end - stat.begin).total!"seconds";

    cues ~= CueInfo(suite.name, suite.name, duration, Clock.currTime);
  }

  void end(ref SuiteResult suite) {
    removeCue(suite.name);
    update;
  }

  override {
    void begin(string suite, ref TestResult test) {
      super.begin(suite, test);

      auto stat = storage.find(suite ~ "." ~ test.name);
      auto duration = (stat.end - stat.begin).total!"seconds";

      cues ~= CueInfo(suite ~ "." ~ test.name, test.name, duration, Clock.currTime);
      update;
    }

    void end(string suite, ref TestResult test) {
      clearProgress;
      super.end(suite, test);
      cues.writeln;
      removeCue(suite ~ "." ~ test.name);
      cues.writeln;
      writer.writeln("");
      update;
    }
  }
}

version(unittest) {
  import fluent.asserts;
  import core.thread;
}

@("it should print a success test")
unittest {
  auto storage = new StatStorage;
  auto begin = SysTime.min;
  auto end = begin + 10.seconds;

  storage.values = [ Stat("some suite", begin, end), Stat("some suite.some test", begin, end) ];

  auto writer = new BufferedWriter;
  auto reporter = new SpecProgressReporter(writer, storage);

  auto suite = SuiteResult("some suite");
  auto test = new TestResult("some test");

  reporter.begin(suite);
  reporter.begin("some suite", test);

  writer.buffer.should.equal("\n*[10s]some suite *[10s]some test");

  Thread.sleep(1.seconds);
  reporter.update();

  writer.buffer.should.equal("\n*[9s]some suite *[9s]some test  ");

  "------------".writeln;
  test.status = TestResult.Status.success;
  reporter.end("some suite", test);
  "------------".writeln;

  writer.buffer.should.equal("\n  some suite                    \n    ✓ some test\n\n*[9s]some suite");
  reporter.end(suite);

  writer.buffer.should.equal("\n  some suite                    \n    ✓ some test\n\n");

  reporter.update();

  writer.buffer.should.equal("\n  some suite                    \n    ✓ some test");
}


@("it should print two success tests")
unittest {
  auto storage = new StatStorage;
  auto begin = SysTime.min;
  auto end = begin + 10.seconds;

  storage.values = [ ];

  auto writer = new BufferedWriter;
  auto reporter = new SpecProgressReporter(writer, storage);

  auto suite = SuiteResult("some suite");
  auto test1 = new TestResult("test1");
  test1.status = TestResult.Status.success;

  auto test2 = new TestResult("test2");
  test2.status = TestResult.Status.success;

  reporter.begin(suite);
  reporter.begin("some suite", test1);
  reporter.end("some suite", test1);

  reporter.begin("some suite", test2);
  writer.buffer.should.equal("\n  some suite              \n    ✓ test1\n*[0s]test2");

  reporter.update();
  writer.buffer.should.equal("\n  some suite              \n    ✓ test1\n*[0s]test2");

  reporter.end("some suite", test2);

  writer.buffer.should.equal("\n  some suite              \n    ✓ test1\n    ✓ test2");
  reporter.end(suite);

  suite.name = "suite2";
  reporter.begin(suite);
  reporter.begin("some suite", test1);

  writer.buffer.should.equal("\n  some suite              \n    ✓ test1\n    ✓ test2\n\n  suite2\n*[0s]suite2 *[0s]test1");
}