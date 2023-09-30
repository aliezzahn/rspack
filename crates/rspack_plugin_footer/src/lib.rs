use async_trait::async_trait;
use rspack_core::{
  rspack_sources::{BoxSource, ConcatSource, RawSource, SourceExt},
  Plugin,
};

#[derive(Debug, Default)]
pub struct FooterPlugin {}

impl FooterPlugin {
  pub fn new() -> Self {
    Self {}
  }
}
#[async_trait]
impl Plugin for FooterPlugin {
  fn name(&self) -> &'static str {
    "rspack.FooterPlugin"
  }
  async fn process_assets_stage_additions(
    &self,
    _ctx: rspack_core::PluginContext,
    args: rspack_core::ProcessAssetsArgs<'_>,
  ) -> rspack_core::PluginProcessAssetsHookOutput {
    let compilation = args.compilation;
    let mut updates = vec![];
    for chunk in compilation.chunk_by_ukey.values() {
      for file in &chunk.files {
        updates.push(file.clone());
      }
    }
    for file in updates {
      let _res = compilation.update_asset(file.as_str(), |old, info| {
        let new: BoxSource =
          ConcatSource::new([old, RawSource::from("/* footer */").boxed()]).boxed();
        Ok((new, info))
      });
    }
    Ok(())
  }
}