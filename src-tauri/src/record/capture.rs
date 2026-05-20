use crate::paths;
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::SampleFormat;
use hound::{SampleFormat as WavSampleFormat, WavSpec, WavWriter};
use serde::Serialize;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU32, Ordering};
use std::sync::mpsc::{self, Sender};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

pub const CHUNK_SECONDS: f64 = 4.0;
const LEVEL_EMIT_INTERVAL: Duration = Duration::from_millis(33);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordLevelEvent {
    pub session_id: String,
    pub level: f32,
}

#[derive(Debug)]
enum CaptureCommand {
    Stop,
    Discard,
}

fn flush_pending_chunk(
    chunk_buffer: &Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    session_id: &str,
    app: &AppHandle,
    chunk_tx: &mpsc::Sender<ChunkJob>,
    chunk_index: &Arc<AtomicU32>,
) {
    let min_samples = (sample_rate as f64 * 0.5) as usize;
    let mut buffer = chunk_buffer.lock().unwrap();
    if buffer.len() < min_samples {
        return;
    }
    let chunk: Vec<f32> = buffer.drain(..).collect();
    drop(buffer);

    let idx = chunk_index.fetch_add(1, Ordering::SeqCst);
    let start_ms = (idx as f64 * CHUNK_SECONDS * 1000.0) as u64;

    if let Ok(tmp) = paths::tmp_dir(app) {
        let wav_path = tmp.join(format!("{session_id}-chunk-tail-{idx}.wav"));
        if write_wav_mono_16k(&wav_path, &chunk, sample_rate).is_ok() {
            let _ = chunk_tx.send(ChunkJob { start_ms, wav_path });
        }
    }
}

#[derive(Debug)]
pub struct CaptureControl {
    pub paused: bool,
    pub stopped: bool,
    pub discarded: bool,
}

pub struct CaptureThread {
    cmd_tx: Sender<CaptureCommand>,
    join: Option<JoinHandle<()>>,
    control: Arc<Mutex<CaptureControl>>,
    samples: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    wav_path: PathBuf,
}

impl CaptureThread {
    pub fn start(
        app: AppHandle,
        session_id: String,
        samples: Arc<Mutex<Vec<f32>>>,
        chunk_tx: mpsc::Sender<ChunkJob>,
    ) -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host
            .default_input_device()
            .ok_or_else(|| "No microphone found".to_string())?;

        let config = device
            .default_input_config()
            .map_err(|e| format!("Failed to read mic config: {e}"))?;

        let sample_rate = config.sample_rate().0;
        let channels = config.channels() as usize;
        let sample_format = config.sample_format();

        let tmp = paths::tmp_dir(&app)?;
        let wav_path = tmp.join(format!("{session_id}.wav"));

        let control = Arc::new(Mutex::new(CaptureControl {
            paused: false,
            stopped: false,
            discarded: false,
        }));
        let (cmd_tx, cmd_rx) = mpsc::channel::<CaptureCommand>();

        let control_cb = Arc::clone(&control);
        let control_loop = Arc::clone(&control);
        let samples_cb = Arc::clone(&samples);
        let app_cb = app.clone();
        let session_cb = session_id.clone();
        let chunk_index = Arc::new(AtomicU32::new(0));
        let chunk_buffer = Arc::new(Mutex::new(Vec::<f32>::new()));

        let join = thread::spawn(move || {
            let chunk_index_cb = Arc::clone(&chunk_index);
            let chunk_buffer_cb = Arc::clone(&chunk_buffer);
            let chunk_buffer_flush = Arc::clone(&chunk_buffer);
            let session_flush = session_id.clone();
            let app_flush = app.clone();
            let chunk_tx_flush = chunk_tx.clone();
            let chunk_index_flush = Arc::clone(&chunk_index);
            let mut last_level = Instant::now();
            let chunk_samples_needed = (sample_rate as f64 * CHUNK_SECONDS) as usize;

            let stream_result = match sample_format {
                SampleFormat::F32 => device.build_input_stream(
                    &config.into(),
                    move |data: &[f32], _| {
                        on_audio(
                            data,
                            channels,
                            &control_cb,
                            &samples_cb,
                            &chunk_buffer_cb,
                            chunk_samples_needed,
                            sample_rate,
                            &session_cb,
                            &app_cb,
                            &chunk_tx,
                            &chunk_index_cb,
                            &mut last_level,
                        );
                    },
                    |err| eprintln!("Whispr mic stream error: {err}"),
                    None,
                ),
                SampleFormat::I16 => device.build_input_stream(
                    &config.into(),
                    move |data: &[i16], _| {
                        let f32_data: Vec<f32> =
                            data.iter().map(|&s| s as f32 / i16::MAX as f32).collect();
                        on_audio(
                            &f32_data,
                            channels,
                            &control_cb,
                            &samples_cb,
                            &chunk_buffer_cb,
                            chunk_samples_needed,
                            sample_rate,
                            &session_cb,
                            &app_cb,
                            &chunk_tx,
                            &chunk_index_cb,
                            &mut last_level,
                        );
                    },
                    |err| eprintln!("Whispr mic stream error: {err}"),
                    None,
                ),
                SampleFormat::U16 => device.build_input_stream(
                    &config.into(),
                    move |data: &[u16], _| {
                        let f32_data: Vec<f32> = data
                            .iter()
                            .map(|&s| {
                                (s as f32 - u16::MAX as f32 / 2.0) / (u16::MAX as f32 / 2.0)
                            })
                            .collect();
                        on_audio(
                            &f32_data,
                            channels,
                            &control_cb,
                            &samples_cb,
                            &chunk_buffer_cb,
                            chunk_samples_needed,
                            sample_rate,
                            &session_cb,
                            &app_cb,
                            &chunk_tx,
                            &chunk_index_cb,
                            &mut last_level,
                        );
                    },
                    |err| eprintln!("Whispr mic stream error: {err}"),
                    None,
                ),
                _ => {
                    eprintln!("Whispr: unsupported microphone sample format");
                    return;
                }
            };

            let stream = match stream_result {
                Ok(s) => s,
                Err(e) => {
                    eprintln!("Whispr: failed to open microphone: {e}");
                    return;
                }
            };

            if let Err(e) = stream.play() {
                eprintln!("Whispr: failed to start microphone: {e}");
                return;
            }

            loop {
                if let Ok(cmd) = cmd_rx.try_recv() {
                    match cmd {
                        CaptureCommand::Stop => {
                            flush_pending_chunk(
                                &chunk_buffer_flush,
                                sample_rate,
                                &session_flush,
                                &app_flush,
                                &chunk_tx_flush,
                                &chunk_index_flush,
                            );
                            control_loop.lock().unwrap().stopped = true;
                            break;
                        }
                        CaptureCommand::Discard => {
                            control_loop.lock().unwrap().stopped = true;
                            control_loop.lock().unwrap().discarded = true;
                            break;
                        }
                    }
                }
                if control_loop.lock().unwrap().stopped {
                    break;
                }
                thread::sleep(Duration::from_millis(50));
            }

            drop(stream);
        });

        Ok(Self {
            cmd_tx,
            join: Some(join),
            control,
            samples,
            sample_rate,
            wav_path,
        })
    }

    pub fn set_paused(&self, paused: bool) {
        let mut c = self.control.lock().unwrap();
        c.paused = paused;
    }

    pub fn stop(&mut self) {
        let _ = self.cmd_tx.send(CaptureCommand::Stop);
        if let Some(j) = self.join.take() {
            let _ = j.join();
        }
    }

    pub fn discard(&mut self) {
        let _ = self.cmd_tx.send(CaptureCommand::Discard);
        if let Some(j) = self.join.take() {
            let _ = j.join();
        }
    }

    pub fn sample_rate(&self) -> u32 {
        self.sample_rate
    }

    pub fn wav_path(&self) -> &Path {
        &self.wav_path
    }

    pub fn take_samples(&self) -> Vec<f32> {
        self.samples.lock().unwrap().clone()
    }
}

pub struct ChunkJob {
    pub start_ms: u64,
    pub wav_path: PathBuf,
}

#[allow(clippy::too_many_arguments)]
fn on_audio(
    data: &[f32],
    channels: usize,
    control: &Arc<Mutex<CaptureControl>>,
    samples: &Arc<Mutex<Vec<f32>>>,
    chunk_buffer: &Arc<Mutex<Vec<f32>>>,
    chunk_samples_needed: usize,
    sample_rate: u32,
    session_id: &str,
    app: &AppHandle,
    chunk_tx: &mpsc::Sender<ChunkJob>,
    chunk_index: &Arc<AtomicU32>,
    last_level: &mut Instant,
) {
    let ctrl = control.lock().unwrap();
    if ctrl.stopped || ctrl.discarded {
        return;
    }

    let mono = stereo_to_mono(data, channels);
    let rms = compute_rms(&mono);

    if last_level.elapsed() >= LEVEL_EMIT_INTERVAL {
        *last_level = Instant::now();
        let _ = app.emit(
            "record:level",
            RecordLevelEvent {
                session_id: session_id.to_string(),
                level: rms,
            },
        );
    }

    if ctrl.paused {
        return;
    }
    drop(ctrl);

    {
        let mut buf = samples.lock().unwrap();
        buf.extend_from_slice(&mono);
    }

    let mut pending = chunk_buffer.lock().unwrap();
    pending.extend_from_slice(&mono);

    while pending.len() >= chunk_samples_needed {
        let chunk: Vec<f32> = pending.drain(..chunk_samples_needed).collect();
        drop(pending);

        let idx = chunk_index.fetch_add(1, Ordering::SeqCst);
        let start_ms = (idx as f64 * CHUNK_SECONDS * 1000.0) as u64;

        if let Ok(tmp) = paths::tmp_dir(app) {
            let wav_path = tmp.join(format!("{session_id}-chunk-{idx}.wav"));
            if write_wav_mono_16k(&wav_path, &chunk, sample_rate).is_ok() {
                let _ = chunk_tx.send(ChunkJob { start_ms, wav_path });
            }
        }

        pending = chunk_buffer.lock().unwrap();
    }
}

fn stereo_to_mono(data: &[f32], channels: usize) -> Vec<f32> {
    if channels <= 1 {
        return data.to_vec();
    }
    data.chunks(channels)
        .map(|frame| frame.iter().sum::<f32>() / channels as f32)
        .collect()
}

fn compute_rms(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return 0.0;
    }
    let sum: f32 = samples.iter().map(|s| s * s).sum();
    (sum / samples.len() as f32).sqrt().min(1.0)
}

pub fn resample_mono_to_16k(input: &[f32], from_rate: u32) -> Vec<i16> {
    if from_rate == 16_000 {
        return input
            .iter()
            .map(|&s| (s.clamp(-1.0, 1.0) * i16::MAX as f32) as i16)
            .collect();
    }
    let ratio = from_rate as f64 / 16_000.0;
    let out_len = ((input.len() as f64) / ratio).ceil() as usize;
    let mut out = Vec::with_capacity(out_len);
    for i in 0..out_len {
        let src_idx = i as f64 * ratio;
        let idx = src_idx as usize;
        let frac = src_idx - idx as f64;
        let s = if idx + 1 < input.len() {
            input[idx] * (1.0 - frac) as f32 + input[idx + 1] * frac as f32
        } else if idx < input.len() {
            input[idx]
        } else {
            0.0
        };
        out.push((s.clamp(-1.0, 1.0) * i16::MAX as f32) as i16);
    }
    out
}

pub fn write_wav_mono_16k(path: &Path, samples: &[f32], from_rate: u32) -> Result<PathBuf, String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let pcm = resample_mono_to_16k(samples, from_rate);
    let spec = WavSpec {
        channels: 1,
        sample_rate: 16_000,
        bits_per_sample: 16,
        sample_format: WavSampleFormat::Int,
    };
    let mut writer = WavWriter::create(path, spec).map_err(|e| e.to_string())?;
    for s in pcm {
        writer.write_sample(s).map_err(|e| e.to_string())?;
    }
    writer.finalize().map_err(|e| e.to_string())?;
    Ok(path.to_path_buf())
}
