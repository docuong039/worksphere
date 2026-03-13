-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th3 13, 2026 lúc 08:03 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `worksphere`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `attachments`
--

CREATE TABLE `attachments` (
  `id` varchar(191) NOT NULL,
  `filename` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `mimeType` varchar(191) NOT NULL,
  `path` varchar(191) NOT NULL,
  `size` int(11) NOT NULL,
  `userId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) NOT NULL,
  `changes` longtext DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `action`, `entityType`, `entityId`, `changes`, `userId`, `createdAt`) VALUES
('cmmastr4l000cu2usqlt6wisg', 'created', 'project', 'cmmastr420005u2usj6r5aukn', '{\"new\":{\"name\":\"Thư viện mầm non\",\"identifier\":\"tvmn\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-03 16:05:00.693'),
('cmmasuiwu000lu2us2zib9sav', 'created', 'project', 'cmmasuiwe000eu2uslkbmqqy6', '{\"new\":{\"name\":\"Quản lý công việc nội bộ công ty BKT\",\"identifier\":\"qlcv\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-03 16:05:36.702'),
('cmmasvkzp000uu2us8gvp40ae', 'created', 'project', 'cmmasvkzf000nu2us8n557m7c', '{\"new\":{\"name\":\"Hệ thống bài giảng BKT\",\"identifier\":\"htbg\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-03 16:06:26.053'),
('cmmc7wes90005u2xchl8xm2dg', 'created', 'task', 'cmmc7wery0001u2xcg15g8y0t', '{\"new\":{\"title\":\"Đọc, nghiên cứu tài liệu BA dự án\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-04 15:54:45.082'),
('cmmc8pvhm0001u298wvkmsfsn', 'updated', 'task', 'cmmc7wery0001u2xcg15g8y0t', '{\"old\":{\"trackerId\":\"cmmbrpgep0000u2j0oaz71g0w\"},\"new\":{\"trackerId\":\"cmmavng2p001au2us66knhxra\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:17:39.753'),
('cmmc8q5ho0005u298r3tjblgg', 'updated', 'task', 'cmmc7wery0001u2xcg15g8y0t', '{\"old\":{\"trackerId\":\"cmmavng2p001au2us66knhxra\"},\"new\":{\"trackerId\":\"cmmavmwhu0019u2us4eu1my98\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:17:52.717'),
('cmmc8s03b000du298wnqeerzl', 'created', 'task', 'cmmc8s0310009u298v6yhicgy', '{\"new\":{\"title\":\"aaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-04 16:19:19.031'),
('cmmc8s7uz000fu298xe8wiyun', 'updated', 'task', 'cmmc8s0310009u298v6yhicgy', '{\"old\":{\"trackerId\":\"cmmbrpgep0000u2j0oaz71g0w\"},\"new\":{\"trackerId\":\"cmmavng2p001au2us66knhxra\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:19:29.099'),
('cmmc95lb10001u2n0z40866dm', 'deleted', 'task', 'cmmc8s0310009u298v6yhicgy', '{\"old\":{\"title\":\"aaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-04 16:29:53.054'),
('cmmc95ocy0003u2n0vunbe57l', 'deleted', 'task', 'cmmc7wery0001u2xcg15g8y0t', '{\"old\":{\"title\":\"Đọc, nghiên cứu tài liệu BA dự án\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-04 16:29:57.011'),
('cmmc95zt50009u2n05ujbq7tq', 'created', 'task', 'cmmc95zsp0005u2n0qsxgq2cm', '{\"new\":{\"title\":\"Đọc, nghiên cứu tài liệu BA dự án\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-04 16:30:11.850'),
('cmmc97576000hu2n0vrx4y4k9', 'created', 'task', 'cmmc9756m000fu2n0anknkjho', '{\"new\":{\"title\":\"aaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:31:05.490'),
('cmmc97adt000ju2n0so0d0j6r', 'updated', 'task', 'cmmc9756m000fu2n0anknkjho', '{\"old\":{\"trackerId\":\"cmmavmwhu0019u2us4eu1my98\"},\"new\":{\"trackerId\":\"cmmavofuj001cu2usp56pl9t5\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:31:12.210'),
('cmmc98275000lu2n0w2vl9yyf', 'deleted', 'task', 'cmmc9756m000fu2n0anknkjho', '{\"old\":{\"title\":\"aaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:31:48.257'),
('cmmc9d2090009u2j8qxg6pz1v', 'created', 'task', 'cmmc9d1zu0005u2j8dqurjmdk', '{\"new\":{\"title\":\"admin\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-04 16:35:41.290'),
('cmmc9dda4000du2j82d5nr1ry', 'updated', 'task', 'cmmc9d1zu0005u2j8dqurjmdk', '{\"old\":{\"trackerId\":\"cmmbrpgep0000u2j0oaz71g0w\"},\"new\":{\"trackerId\":\"cmmavo1m5001bu2usnfyhggnb\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 16:35:55.900'),
('cmmcakjac0001u274s6230u7c', 'updated', 'task', 'cmmc9d1zu0005u2j8dqurjmdk', '{\"old\":{\"trackerId\":\"cmmavo1m5001bu2usnfyhggnb\"},\"new\":{\"trackerId\":\"cmmavng2p001au2us66knhxra\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 17:09:29.892'),
('cmmcakvu20005u274qdq1vpku', 'updated', 'task', 'cmmc95zsp0005u2n0qsxgq2cm', '{\"old\":{\"trackerId\":\"cmmbrpgep0000u2j0oaz71g0w\"},\"new\":{\"trackerId\":\"cmmavo1m5001bu2usnfyhggnb\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 17:09:46.154'),
('cmmcas8xb0016u274kf37zr62', 'deleted', 'task', 'cmmc95zsp0005u2n0qsxgq2cm', '{\"old\":{\"title\":\"Đọc, nghiên cứu tài liệu BA dự án\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-04 17:15:29.711'),
('cmmcasbnl0018u274tnhqlhi7', 'deleted', 'task', 'cmmc9d1zu0005u2j8dqurjmdk', '{\"old\":{\"title\":\"admin\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-04 17:15:33.249'),
('cmmcaso3k001eu274b9rfpj18', 'created', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"new\":{\"title\":\"Đọc, nghiên cứu tài liệu BA dự án\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-04 17:15:49.376'),
('cmmcavztk002gu274fis4hh2p', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"estimatedHours\":null,\"startDate\":null,\"dueDate\":null},\"new\":{\"estimatedHours\":40,\"startDate\":\"2026-05-01\",\"dueDate\":\"2026-05-06\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-04 17:18:24.536'),
('cmmcaxkl5002ku274brs42r3l', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"dueDate\":\"2026-05-06\"},\"new\":{\"dueDate\":\"2026-05-09\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-04 17:19:38.106'),
('cmmcsnpce0003u27s7a9oex22', 'created', 'task', 'cmmcsnpc60001u27sm5k26k8t', '{\"new\":{\"title\":\"aaaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:35:50.798'),
('cmmcsnxvs0005u27s0vyxveci', 'updated', 'task', 'cmmcsnpc60001u27sm5k26k8t', '{\"old\":{\"trackerId\":\"cmmavmwhu0019u2us4eu1my98\"},\"new\":{\"trackerId\":\"cmmavng2p001au2us66knhxra\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:36:01.865'),
('cmmcsoguo0007u27s3a8p7wi9', 'deleted', 'task', 'cmmcsnpc60001u27sm5k26k8t', '{\"old\":{\"title\":\"aaaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:36:26.449'),
('cmmcsrjvc004lu27s2ivlf3nl', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:38:50.329'),
('cmmcsrl3f004pu27sy8jjg7pn', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:38:51.915'),
('cmmcsyffi004xu27s8icyklyk', 'created', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"new\":{\"title\":\"Thiết kế, code giao diện FE cho hệ thống\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-05 01:44:11.167'),
('cmmct5mhf004zu27s5vmk6wfi', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:49:46.900'),
('cmmct5plo0053u27szz48703w', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 01:49:50.940'),
('cmmctuf83005bu27s0wnn07vq', 'created', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"new\":{\"title\":\"Lập danh sách testcase dự án\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-05 02:09:03.892'),
('cmmctvzig005hu27s5gig1j5h', 'created', 'task', 'cmmctvzi1005du27stddqnnwz', '{\"new\":{\"title\":\"Làm 20 bài giảng data cho hệ thống\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-05 02:10:16.840'),
('cmmcumpy00003u2t8rwxtb88t', 'created', 'task', 'cmmcumpxq0001u2t8d6vwqful', '{\"new\":{\"title\":\"Đọc tài liệu yêu cầu chức năng hệ thống\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:31:04.152'),
('cmmcup0760005u2t8zbx7n9z6', 'updated', 'task', 'cmmcumpxq0001u2t8d6vwqful', '{\"old\":{\"doneRatio\":0,\"startDate\":null,\"dueDate\":null},\"new\":{\"doneRatio\":100,\"startDate\":\"2026-03-01\",\"dueDate\":\"2026-03-02\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:32:50.754'),
('cmmcuszka0009u2t8t7yho5zy', 'created', 'task', 'cmmcuszk00007u2t8zqilzb7j', '{\"new\":{\"title\":\"Đọc tài liệu database hệ thống \",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:35:56.555'),
('cmmcv5egs0003u2k0a1ra1jhf', 'created', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"new\":{\"title\":\"code giao diện đăng nhập, đăng ký\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:45:35.741'),
('cmmcv73k50007u2k0avn8ui1s', 'created', 'task', 'cmmcv73jt0005u2k006pa6ra3', '{\"new\":{\"title\":\"code giao diện công việc (kanban, list)\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:46:54.917'),
('cmmcv7b4l0009u2k0qi21mjy9', 'updated', 'task', 'cmmcv73jt0005u2k006pa6ra3', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:47:04.726'),
('cmmcv7gbx000bu2k0wde3yx8g', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 02:47:11.469'),
('cmmcx60j40003u2e8stglbtsw', 'created', 'task', 'cmmcx60ir0001u2e861jk80cu', '{\"new\":{\"title\":\"aaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:03.568'),
('cmmcx669u0005u2e8kjbdo6b1', 'deleted', 'task', 'cmmcx60ir0001u2e861jk80cu', '{\"old\":{\"title\":\"aaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:11.011'),
('cmmcx6eer0007u2e8sdih8m4c', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:21.555'),
('cmmcx6f0l0009u2e8fgkq3t3w', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:22.341'),
('cmmcx6fu2000bu2e8lbowmftt', 'updated', 'task', 'cmmcv73jt0005u2k006pa6ra3', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:23.402'),
('cmmcx6g8j000du2e80fp8tzy8', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:23.924'),
('cmmcx6hzt000fu2e8gqr8bmz6', 'updated', 'task', 'cmmcv73jt0005u2k006pa6ra3', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:26.201'),
('cmmcx6inb000hu2e86yh37pty', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 03:42:27.047'),
('cmmcz6nfi0003u2mc5x4dmhsw', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:38:32.478'),
('cmmczawge000fu2mcwuze85fw', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:41:50.798'),
('cmmczb3mv000ju2mcxwicx63q', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:00.104'),
('cmmczbq6j000nu2mcimchtd7s', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:29.323'),
('cmmczbqzl000pu2mcc9mrk60a', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:30.369'),
('cmmczbrzj000ru2mcfx4nx8vy', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:31.663'),
('cmmczbsne000tu2mcemrnmyd5', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:32.523'),
('cmmczbtg5000vu2mce8kelikj', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:33.558'),
('cmmczbu1n000xu2mcfvrxi8uz', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:34.331'),
('cmmczbutj000zu2mcwidhqqox', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:35.336'),
('cmmczbw2l0011u2mcj7kut3zq', 'updated', 'task', 'cmmcv73jt0005u2k006pa6ra3', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:36.957'),
('cmmczbwqi0013u2mclnb2xaef', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:37.818'),
('cmmczbxfm0015u2mc51orc50w', 'updated', 'task', 'cmmcv73jt0005u2k006pa6ra3', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:38.723'),
('cmmczbyec0017u2mc8ywabeoy', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:39.972'),
('cmmczc0000019u2mcrzrw7807', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:42.048'),
('cmmczc84l001bu2mcgfpddj1w', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:52.581'),
('cmmczcaiz001fu2mcmkgiyiq2', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:42:55.692'),
('cmmczfncy001ju2mcrdojoqvo', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:45:32.290'),
('cmmczfq3c001nu2mc8csyfxh1', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:45:35.832'),
('cmmd41yck0001u2wggwmw54q3', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 06:54:51.428'),
('cmmd462ei0007u2wg101rpbki', 'created', 'task', 'cmmd462e40005u2wgihinc7mw', '{\"new\":{\"title\":\"Thiết kế file test\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 06:58:03.306'),
('cmmd49joq000bu2wglutrdzkh', 'created', 'task', 'cmmd49jof0009u2wgh6htqluy', '{\"new\":{\"title\":\"Thiết kế nội dung test case\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 07:00:45.675'),
('cmmd4apbr000du2wg2c0k51nx', 'updated', 'task', 'cmmd49jof0009u2wgh6htqluy', '{\"old\":{\"assigneeId\":null,\"doneRatio\":0,\"estimatedHours\":null,\"startDate\":null,\"dueDate\":null},\"new\":{\"assigneeId\":\"cmmasg2610001u2us3vcic1ld\",\"doneRatio\":70,\"estimatedHours\":8,\"startDate\":\"2026-03-02\",\"dueDate\":\"2026-03-04\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 07:01:39.639'),
('cmmd4ym500003u2ao7ni0qc7b', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 07:20:15.252'),
('cmmd4yro20009u2ao7cniilmp', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 07:20:22.418'),
('cmmd95tqj0009u2pc0jbkd5m9', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 09:17:50.156'),
('cmmd95uyy000fu2pcoq12chqo', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 09:17:51.754'),
('cmmd96d6g000nu2pck6p90bhr', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 09:18:15.352'),
('cmmd97ao9000xu2pc2r00g73f', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 09:18:58.761'),
('cmmd9jmf20013u2pco2hf3l2j', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 09:28:33.854'),
('cmmd9jpe10017u2pcgykyp3qe', 'updated', 'task', 'cmmctuf7q0057u27sdp6n9ja7', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-05 09:28:37.706'),
('cmmd9sgha001qu2pcof90dvl0', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:35:26.062'),
('cmmd9sl9d001wu2pcanrrnmmh', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:35:32.257'),
('cmmd9t2c50022u2pcmi6nojfr', 'updated', 'task', 'cmmcumpxq0001u2t8d6vwqful', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:35:54.389'),
('cmmd9t4uf0024u2pcww2aukrt', 'updated', 'task', 'cmmcuszk00007u2t8zqilzb7j', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:35:57.640'),
('cmmd9t5rc0026u2pcgon25t1n', 'updated', 'task', 'cmmcumpxq0001u2t8d6vwqful', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:35:58.825'),
('cmmd9t72u0028u2pccqjy6zl8', 'updated', 'task', 'cmmcuszk00007u2t8zqilzb7j', '{\"old\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\",\"doneRatio\":100},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\",\"doneRatio\":0}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:36:00.534'),
('cmmda062a002gu2pcy17n3rb6', 'created', 'task', 'cmmda0623002eu2pcw5rfd3y3', '{\"new\":{\"title\":\"aaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:41:25.810'),
('cmmda0f34002iu2pcgj2wdy5r', 'updated', 'task', 'cmmda0623002eu2pcw5rfd3y3', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:41:37.504'),
('cmmda0sxd002mu2pcaopt9d2f', 'updated', 'task', 'cmmda0623002eu2pcw5rfd3y3', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:41:55.441'),
('cmmda1361002qu2pcfx0nzfy0', 'deleted', 'task', 'cmmda0623002eu2pcw5rfd3y3', '{\"old\":{\"title\":\"aaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 09:42:08.713'),
('cmmdbmunz002wu2pc4e5vxug8', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"doneRatio\":100},\"new\":{\"doneRatio\":10}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 10:27:03.743'),
('cmmdbn5if0030u2pckkrnhha6', 'updated', 'task', 'cmmcv5egf0001u2k0hofp3b7y', '{\"old\":{\"doneRatio\":10},\"new\":{\"doneRatio\":100}}', 'cmmasgund0003u2us3ze0elku', '2026-03-05 10:27:17.799'),
('cmmdqg6hu0003u2s8wrrpt0ea', 'created', 'task', 'cmmdqg6hm0001u2s84237mkoq', '{\"new\":{\"title\":\"aaaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-05 17:21:46.723'),
('cmmdqgq8o0005u2s8v5txenyu', 'deleted', 'task', 'cmmdqg6hm0001u2s84237mkoq', '{\"old\":{\"title\":\"aaaaaa\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-05 17:22:12.312'),
('cmmeau5cr000iu2tcj0exweqi', 'created', 'project', 'cmmeau5b20001u2tc8kgapai5', '{\"new\":{\"name\":\"aaaa\",\"identifier\":\"a\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-06 02:52:30.746'),
('cmmed2cz6000ru2tcsu2fdlhg', 'created', 'task', 'cmmed2cyk000nu2tcxx5rm1ua', '{\"new\":{\"title\":\"bbbb\",\"projectId\":\"cmmeau5b20001u2tc8kgapai5\"}}', 'cmltm70dd002ku26omn2zqhha', '2026-03-06 03:54:53.107'),
('cmmedec55000xu2tcxhpjzkd2', 'created', 'task', 'cmmedec4m000tu2tcx4z9b59d', '{\"new\":{\"title\":\"Code backend hệ thống bài giảng\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-06 04:04:11.898'),
('cmmedgk7w001gu2tcrpp0qe4m', 'created', 'project', 'cmmedgk78000zu2tc2jjupbb0', '{\"new\":{\"name\":\"aaaa\",\"identifier\":\"ab\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-06 04:05:55.676'),
('cmmedgwag001ku2tcxh5yxu5e', 'deleted', 'project', 'cmmedgk78000zu2tc2jjupbb0', '{\"old\":{\"name\":\"aaaa\",\"identifier\":\"ab\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-06 04:06:11.320'),
('cmmequlzp0001u2csdp61c7i9', 'updated', 'task', 'cmmcaso35001au274wg6r6ymb', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-06 10:20:46.165'),
('cmmequmx90005u2csgl8m7k0t', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70al0012u26on2c5mamw\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-06 10:20:47.374'),
('cmmfncnx60003u2y0tjtvycnl', 'created', 'task', 'cmmfncnww0001u2y0irona5ro', '{\"new\":{\"title\":\"Xây dựng test case FE\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-07 01:30:36.186'),
('cmmfnvekp0003u2hgt52ji2lb', 'updated', 'task', 'cmmcsyff3004tu27sx16opkkx', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-07 01:45:10.537'),
('cmmfnwp9k0009u2hgxjmackwq', 'created', 'task', 'cmmfnwp980007u2hgettvvyk6', '{\"new\":{\"title\":\"Fix lỗi giao diện bài giảng\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-07 01:46:11.049'),
('cmmfo5n4n000fu2hgntpt9phw', 'created', 'task', 'cmmfo5n46000du2hga2zr7bly', '{\"new\":{\"title\":\"Báo cáo test\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-07 01:53:08.183'),
('cmmfo5puh000hu2hg8pa84aiz', 'updated', 'task', 'cmmfo5n46000du2hga2zr7bly', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70al0011u26oqip1qd6q\"}}', 'cmmasg2610001u2us3vcic1ld', '2026-03-07 01:53:11.705'),
('cmmfot7x00001u2uwg3dxey1b', 'updated', 'task', 'cmmfnwp980007u2hgettvvyk6', '{\"old\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"},\"new\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-07 02:11:28.212'),
('cmmfot9600003u2uwz199ygio', 'updated', 'task', 'cmmfnwp980007u2hgettvvyk6', '{\"old\":{\"statusId\":\"cmltm70ak000zu26osulp9e23\"},\"new\":{\"statusId\":\"cmltm70ak000yu26obbti3jjz\"}}', 'cmmasgund0003u2us3ze0elku', '2026-03-07 02:11:29.832'),
('cmmfou6n2000mu2uwdmpsail6', 'created', 'project', 'cmmfou6mh0005u2uwz7n5h1lw', '{\"new\":{\"name\":\"Hệ thống quản lý công việc\",\"identifier\":\"htqlcv\"}}', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-07 02:12:13.214');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `comments`
--

CREATE TABLE `comments` (
  `id` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `comments`
--

INSERT INTO `comments` (`id`, `content`, `taskId`, `userId`, `createdAt`, `updatedAt`) VALUES
('cmmcz7sox0007u2mctu5nlhzq', 'Làm tốt lắm', 'cmmcsyff3004tu27sx16opkkx', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-05 04:39:25.954', '2026-03-05 04:39:25.954'),
('cmmcz7z0j000bu2mcgdpb8884', 'vâng anh', 'cmmcsyff3004tu27sx16opkkx', 'cmmasgund0003u2us3ze0elku', '2026-03-05 04:39:34.148', '2026-03-05 09:12:37.319'),
('cmmfpah38000qu2uw8xpl07kb', 'đọc kỹ tài liệu để triển khai em nhé', 'cmmcaso35001au274wg6r6ymb', 'cmmasfn2l0000u2usqqrndb3w', '2026-03-07 02:24:53.253', '2026-03-07 02:24:53.253'),
('cmmfpan5f000uu2uw0lqokhio', 'vâng anh', 'cmmcaso35001au274wg6r6ymb', 'cmmasgund0003u2us3ze0elku', '2026-03-07 02:25:01.108', '2026-03-07 02:25:01.108');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `userId` varchar(191) NOT NULL,
  `metadata` longtext DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `isRead`, `userId`, `metadata`, `createdAt`) VALUES
('cmmaszr4l000xu2usguoc282j', 'project_member_added', 'Bạn được thêm vào dự án', 'Quản trị hệ thống đã thêm bạn vào dự án \"Hệ thống bài giảng BKT\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-03 16:09:40.629'),
('cmmat020l0010u2usw5mtdl0s', 'project_member_added', 'Bạn được thêm vào dự án', 'Quản trị hệ thống đã thêm bạn vào dự án \"Quản lý công việc nội bộ công ty BKT\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"projectId\":\"cmmasuiwe000eu2uslkbmqqy6\"}', '2026-03-03 16:09:54.742'),
('cmmat0dzh0013u2usfe3ovu2p', 'project_member_added', 'Bạn được thêm vào dự án', 'Quản trị hệ thống đã thêm bạn vào dự án \"Thư viện mầm non\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"projectId\":\"cmmastr420005u2usj6r5aukn\"}', '2026-03-03 16:10:10.253'),
('cmmavu54l001nu2usin8e9eh6', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Hệ thống bài giảng BKT\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-03 17:29:17.685'),
('cmmavudgj001qu2us35s3q13z', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Hệ thống bài giảng BKT\"', 0, 'cmmasget30002u2uscx10t258', '{\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-03 17:29:28.483'),
('cmmavuign001tu2usz4u2epf8', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Hệ thống bài giảng BKT\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-03 17:29:34.967'),
('cmmavur8n001wu2usvuo0amoa', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Quản lý công việc nội bộ công ty BKT\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"projectId\":\"cmmasuiwe000eu2uslkbmqqy6\"}', '2026-03-03 17:29:46.343'),
('cmmavv00n001zu2usi3vq0lvp', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Quản lý công việc nội bộ công ty BKT\"', 0, 'cmmasget30002u2uscx10t258', '{\"projectId\":\"cmmasuiwe000eu2uslkbmqqy6\"}', '2026-03-03 17:29:57.720'),
('cmmavv3aq0022u2uszw1kkz7c', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Quản lý công việc nội bộ công ty BKT\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"projectId\":\"cmmasuiwe000eu2uslkbmqqy6\"}', '2026-03-03 17:30:01.971'),
('cmmavvjvd0025u2usznu7sh45', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Thư viện mầm non\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"projectId\":\"cmmastr420005u2usj6r5aukn\"}', '2026-03-03 17:30:23.449'),
('cmmavvobn0028u2us0bhmbud4', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Thư viện mầm non\"', 0, 'cmmasget30002u2uscx10t258', '{\"projectId\":\"cmmastr420005u2usj6r5aukn\"}', '2026-03-03 17:30:29.219'),
('cmmavvqr9002bu2usg900awtt', 'project_member_added', 'Bạn được thêm vào dự án', 'Lê Đức Anh đã thêm bạn vào dự án \"Thư viện mầm non\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"projectId\":\"cmmastr420005u2usj6r5aukn\"}', '2026-03-03 17:30:32.373'),
('cmmc7wes60003u2xccolf6q0z', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmc7wery0001u2xcg15g8y0t\"}', '2026-03-04 15:54:45.079'),
('cmmc8pvht0003u298hrheqb0b', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc7wery0001u2xcg15g8y0t\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:17:39.761'),
('cmmc8q5hs0007u298lj96lw3z', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc7wery0001u2xcg15g8y0t\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:17:52.720'),
('cmmc8s038000bu298qln43bbw', 'task_assigned', 'Bạn được gán công việc mới', 'Quản trị hệ thống đã gán cho bạn công việc: \"aaaa\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmc8s0310009u298v6yhicgy\"}', '2026-03-04 16:19:19.028'),
('cmmc8s7v4000hu298jkeakcli', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"aaaa\"', 1, 'cmltm70dd002ku26omn2zqhha', '{\"taskId\":\"cmmc8s0310009u298v6yhicgy\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:19:29.104'),
('cmmc95zt20007u2n0rd867ynn', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmc95zsp0005u2n0qsxgq2cm\"}', '2026-03-04 16:30:11.847'),
('cmmc96gst000bu2n00llywcnm', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc95zsp0005u2n0qsxgq2cm\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:30:33.870'),
('cmmc96su5000du2n0qn9muii9', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc95zsp0005u2n0qsxgq2cm\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:30:49.469'),
('cmmc9c12v0001u2j8zdnt27gp', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc95zsp0005u2n0qsxgq2cm\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:34:53.431'),
('cmmc9cgkj0003u2j84b4v5nmp', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc95zsp0005u2n0qsxgq2cm\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:35:13.507'),
('cmmc9d2060007u2j8avjitvuv', 'task_assigned', 'Bạn được gán công việc mới', 'Quản trị hệ thống đã gán cho bạn công việc: \"admin\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmc9d1zu0005u2j8dqurjmdk\"}', '2026-03-04 16:35:41.287'),
('cmmc9d9eo000bu2j8j2cn3u8l', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"admin\"', 1, 'cmltm70dd002ku26omn2zqhha', '{\"taskId\":\"cmmc9d1zu0005u2j8dqurjmdk\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:35:50.880'),
('cmmc9dda6000fu2j8ds93n7rb', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"admin\"', 1, 'cmltm70dd002ku26omn2zqhha', '{\"taskId\":\"cmmc9d1zu0005u2j8dqurjmdk\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 16:35:55.902'),
('cmmcakjaf0003u274e8e7ojp6', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"admin\"', 1, 'cmltm70dd002ku26omn2zqhha', '{\"taskId\":\"cmmc9d1zu0005u2j8dqurjmdk\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 17:09:29.895'),
('cmmcakvu90007u274ee8p4cw5', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmc95zsp0005u2n0qsxgq2cm\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 17:09:46.161'),
('cmmcaso3g001cu2745wtnohaa', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\"}', '2026-03-04 17:15:49.372'),
('cmmcavztr002iu274i4p85wkb', 'task_updated', 'Công việc được cập nhật', 'Lê Đức Anh đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 17:18:24.543'),
('cmmcaxkl8002mu274gcv8jyc4', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-04 17:19:38.108'),
('cmmcsrjvi004nu27s4z402cq0', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Mới sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 01:38:50.334'),
('cmmcsrl3h004ru27sb4zt6al0', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Đang làm sang Mới', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 01:38:51.918'),
('cmmcsyffg004vu27szbz512wm', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Thiết kế, code giao diện FE cho hệ thống\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\"}', '2026-03-05 01:44:11.164'),
('cmmct5mhj0051u27s2iygq9lj', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Mới sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 01:49:46.903'),
('cmmct5pls0055u27sk0xhi9sr', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Mới sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 01:49:50.944'),
('cmmctuf810059u27s904wyhib', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Lập danh sách testcase dự án\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\"}', '2026-03-05 02:09:03.889'),
('cmmctvzie005fu27sh83i35ri', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Làm 20 bài giảng data cho hệ thống\"', 0, 'cmmasget30002u2uscx10t258', '{\"taskId\":\"cmmctvzi1005du27stddqnnwz\"}', '2026-03-05 02:10:16.838'),
('cmmcz6nfq0005u2mcvlquway7', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:38:32.486'),
('cmmcz7spq0009u2mci02bs45e', 'task_comment_added', 'Bình luận mới', 'Lê Đức Anh đã bình luận về \"Thiết kế, code giao diện FE cho hệ thống\": \"Làm tốt lắm\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\",\"commentId\":\"cmmcz7sox0007u2mctu5nlhzq\"}', '2026-03-05 04:39:25.982'),
('cmmcz7z1e000du2mc8u8kdahr', 'task_comment_added', 'Bình luận mới', 'Lê Tuấn Long đã bình luận về \"Thiết kế, code giao diện FE cho hệ thống\": \"vâng anh\"', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\",\"commentId\":\"cmmcz7z0j000bu2mcgdpb8884\"}', '2026-03-05 04:39:34.178'),
('cmmczawgs000hu2mcshtncch5', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Chờ kiểm thử sang Đóng', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:41:50.812'),
('cmmczb3nd000lu2mctu7vym0t', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Đóng sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:42:00.121'),
('cmmczc84t001du2mc7lp7l8k0', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Chờ kiểm thử sang Đóng', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:42:52.589'),
('cmmczcaja001hu2mctv2rxd6k', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Đóng sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:42:55.702'),
('cmmczfnde001lu2mcktnd4pz0', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Chờ kiểm thử sang Đóng', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:45:32.307'),
('cmmczfq3i001pu2mc2f2q2w1v', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Đóng sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 04:45:35.839'),
('cmmd41ycp0003u2wglra4edyd', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Mới sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 06:54:51.433'),
('cmmd4ym570006u2ao2me68d2r', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 07:20:15.259'),
('cmmd4ym570007u2aogjqp9ecn', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 07:20:15.259'),
('cmmd4yro6000cu2aobkreldbr', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 07:20:22.422'),
('cmmd4yro6000du2aobjfk0ft5', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 07:20:22.422'),
('cmmd95tqu000cu2pca0phh2tm', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:17:50.167'),
('cmmd95tqu000du2pcw6kol886', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:17:50.167'),
('cmmd95uz6000iu2pc3q3v5jyk', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:17:51.762'),
('cmmd95uz6000ju2pcm8iyqgjm', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:17:51.762'),
('cmmd96d6s000ru2pcan3o0u5i', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmltm70dd002ku26omn2zqhha', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:18:15.364'),
('cmmd96d6s000su2pcsqokjnut', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:18:15.364'),
('cmmd96d6s000tu2pcbwxyihxj', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:18:15.364'),
('cmmd97aog0010u2pcrhygbx48', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:18:58.768'),
('cmmd97aog0011u2pcfzhocdpq', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:18:58.768'),
('cmmd9jmfb0015u2pcxoz3dw2o', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:28:33.863'),
('cmmd9jpeb0019u2pc17sjty1t', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Nguyễn Đức Nhã đã chuyển \"Lập danh sách testcase dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmctuf7q0057u27sdp6n9ja7\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:28:37.715'),
('cmmd9sghi001tu2pctnofl0y3', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:35:26.071'),
('cmmd9sghi001uu2pcccw5rfax', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Đang làm sang Chờ kiểm thử', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:35:26.071'),
('cmmd9sl9n001zu2pc0jda5n67', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:35:32.267'),
('cmmd9sl9n0020u2pcidmmbuyv', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Chờ kiểm thử sang Đang làm', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:35:32.267'),
('cmmd9yedk002cu2pcliki2oeq', 'task_watcher_added', 'Bạn được thêm theo dõi công việc', 'Lê Tuấn Long đã thêm bạn vào danh sách theo dõi công việc: \"Đọc, nghiên cứu tài liệu BA dự án\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\"}', '2026-03-05 09:40:03.273'),
('cmmda0sxn002ou2pc9ckfgkle', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"aaaaa\" từ Đang làm sang Mới', 1, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmda0623002eu2pcw5rfd3y3\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 09:41:55.451'),
('cmmdbmn4o002uu2pc18u0mj6e', 'task_watcher_added', 'Bạn được thêm theo dõi công việc', 'Lê Tuấn Long đã thêm bạn vào danh sách theo dõi công việc: \"Thiết kế, code giao diện FE cho hệ thống\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\"}', '2026-03-05 10:26:53.976'),
('cmmdbmuob002yu2pca4rd9kko', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"code giao diện đăng nhập, đăng ký\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmcv5egf0001u2k0hofp3b7y\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 10:27:03.755'),
('cmmdbn5iq0032u2pci298yoff', 'task_updated', 'Công việc được cập nhật', 'Lê Tuấn Long đã cập nhật công việc \"code giao diện đăng nhập, đăng ký\"', 1, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmcv5egf0001u2k0hofp3b7y\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-05 10:27:17.810'),
('cmmed1wi6000lu2tc6bhsu6zt', 'project_member_added', 'Bạn được thêm vào dự án', 'Quản trị hệ thống đã thêm bạn vào dự án \"aaaa\"', 0, 'cmmasg2610001u2us3vcic1ld', '{\"projectId\":\"cmmeau5b20001u2tc8kgapai5\"}', '2026-03-06 03:54:31.759'),
('cmmed2cz0000pu2tcksn1s1yj', 'task_assigned', 'Bạn được gán công việc mới', 'Quản trị hệ thống đã gán cho bạn công việc: \"bbbb\"', 0, 'cmmasg2610001u2us3vcic1ld', '{\"taskId\":\"cmmed2cyk000nu2tcxx5rm1ua\"}', '2026-03-06 03:54:53.101'),
('cmmedec50000vu2tce32fsd64', 'task_assigned', 'Bạn được gán công việc mới', 'Lê Đức Anh đã gán cho bạn công việc: \"Code backend hệ thống bài giảng\"', 1, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmedec4m000tu2tcx4z9b59d\"}', '2026-03-06 04:04:11.892'),
('cmmedgk8a001iu2tcwbvjemnp', 'project_created', 'Dự án mới được tạo', 'Lê Đức Anh đã tạo dự án mới \"aaaa\"', 1, 'cmltm70dd002ku26omn2zqhha', '{\"projectId\":\"cmmedgk78000zu2tc2jjupbb0\"}', '2026-03-06 04:05:55.690'),
('cmmequlzv0003u2csgy3ky9q9', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Đức Anh đã chuyển \"Đọc, nghiên cứu tài liệu BA dự án\" từ Đang làm sang Chờ kiểm thử', 0, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-06 10:20:46.171'),
('cmmequmxk0007u2csr9h8hz8k', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Đức Anh đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Chờ kiểm thử sang Đang làm', 0, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-06 10:20:47.384'),
('cmmfnv2g90001u2hg30q9exse', 'task_updated', 'Công việc được cập nhật', 'Lê Đức Anh đã cập nhật công việc \"Thiết kế, code giao diện FE cho hệ thống\"', 0, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-07 01:44:54.826'),
('cmmfnveku0005u2hguq5lubih', 'task_status_changed', 'Trạng thái công việc đã thay đổi', 'Lê Tuấn Long đã chuyển \"Thiết kế, code giao diện FE cho hệ thống\" từ Đang làm sang Đóng', 0, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcsyff3004tu27sx16opkkx\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\"}', '2026-03-07 01:45:10.542'),
('cmmfou6n4000ou2uw3c1p820g', 'project_created', 'Dự án mới được tạo', 'Lê Đức Anh đã tạo dự án mới \"Hệ thống quản lý công việc\"', 1, 'cmltm70dd002ku26omn2zqhha', '{\"projectId\":\"cmmfou6mh0005u2uwz7n5h1lw\"}', '2026-03-07 02:12:13.216'),
('cmmfpah3u000su2uwrp3ap6p9', 'task_comment_added', 'Bình luận mới', 'Lê Đức Anh đã bình luận về \"Đọc, nghiên cứu tài liệu BA dự án\": \"đọc kỹ tài liệu để triển khai em nhé\"', 0, 'cmmasgund0003u2us3ze0elku', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\",\"commentId\":\"cmmfpah38000qu2uw8xpl07kb\"}', '2026-03-07 02:24:53.274'),
('cmmfpan5y000wu2uwg75bsd12', 'task_comment_added', 'Bình luận mới', 'Lê Tuấn Long đã bình luận về \"Đọc, nghiên cứu tài liệu BA dự án\": \"vâng anh\"', 0, 'cmmasfn2l0000u2usqqrndb3w', '{\"taskId\":\"cmmcaso35001au274wg6r6ymb\",\"projectId\":\"cmmasvkzf000nu2us8n557m7c\",\"commentId\":\"cmmfpan5f000uu2uw0lqokhio\"}', '2026-03-07 02:25:01.126');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `permissions`
--

CREATE TABLE `permissions` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `module` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `permissions`
--

INSERT INTO `permissions` (`id`, `key`, `name`, `description`, `module`, `createdAt`) VALUES
('cmltm70960000u26occe6hv9s', 'tasks.view_all', 'Xem tất cả công việc', NULL, 'TASKS', '2026-02-19 15:27:16.746'),
('cmltm70980001u26oiug0m2xk', 'tasks.view_project', 'Xem công việc trong dự án', NULL, 'TASKS', '2026-02-19 15:27:16.749'),
('cmltm709a0002u26o9ejdegm2', 'tasks.view_assigned', 'Xem công việc được gán', NULL, 'TASKS', '2026-02-19 15:27:16.751'),
('cmltm709b0003u26oc0fgyk7e', 'tasks.create', 'Tạo công việc', NULL, 'TASKS', '2026-02-19 15:27:16.752'),
('cmltm709d0004u26o5nmlk31y', 'tasks.edit_any', 'Sửa bất kỳ công việc', NULL, 'TASKS', '2026-02-19 15:27:16.753'),
('cmltm709e0005u26oqfzjcjcm', 'tasks.edit_assigned', 'Sửa công việc được gán', NULL, 'TASKS', '2026-02-19 15:27:16.754'),
('cmltm709g0006u26obaz0nmwk', 'tasks.edit_own', 'Sửa công việc của mình', NULL, 'TASKS', '2026-02-19 15:27:16.756'),
('cmltm709h0007u26ocwk2gao7', 'tasks.delete_any', 'Xóa bất kỳ công việc', NULL, 'TASKS', '2026-02-19 15:27:16.757'),
('cmltm709i0008u26oqv082jju', 'tasks.delete_own', 'Xóa công việc của mình', NULL, 'TASKS', '2026-02-19 15:27:16.759'),
('cmltm709k0009u26ony5d3ktv', 'tasks.manage_watchers', 'Quản lý người theo dõi', NULL, 'TASKS', '2026-02-19 15:27:16.760'),
('cmltm709l000au26odw2lljrt', 'comments.add', 'Thêm bình luận', NULL, 'COMMENTS', '2026-02-19 15:27:16.762'),
('cmltm709n000bu26orl9i64rj', 'comments.edit_own', 'Sửa bình luận của mình', NULL, 'COMMENTS', '2026-02-19 15:27:16.763'),
('cmltm709o000cu26ozzaw8u9w', 'comments.edit_all', 'Sửa tất cả bình luận', NULL, 'COMMENTS', '2026-02-19 15:27:16.765'),
('cmltm709p000du26ot0p3loue', 'comments.delete_own', 'Xóa bình luận của mình', NULL, 'COMMENTS', '2026-02-19 15:27:16.766'),
('cmltm709r000eu26okwhhpxcf', 'comments.delete_all', 'Xóa tất cả bình luận', NULL, 'COMMENTS', '2026-02-19 15:27:16.767'),
('cmltm709s000fu26okxnq0l2s', 'timelogs.log_time', 'Ghi nhận thời gian', NULL, 'TIMELOGS', '2026-02-19 15:27:16.768'),
('cmltm709t000gu26ohlylcilj', 'timelogs.view_all', 'Xem tất cả thời gian', NULL, 'TIMELOGS', '2026-02-19 15:27:16.769'),
('cmltm709v000hu26oj8sd7kl0', 'timelogs.view_own', 'Xem thời gian của mình', NULL, 'TIMELOGS', '2026-02-19 15:27:16.771'),
('cmltm709w000iu26omre1p5oh', 'timelogs.edit_all', 'Sửa tất cả thời gian', NULL, 'TIMELOGS', '2026-02-19 15:27:16.773'),
('cmltm709z000ju26osfx5rrek', 'timelogs.edit_own', 'Sửa thời gian của mình', NULL, 'TIMELOGS', '2026-02-19 15:27:16.775'),
('cmltm70a0000ku26oeari7k5m', 'timelogs.delete_all', 'Xóa tất cả thời gian', NULL, 'TIMELOGS', '2026-02-19 15:27:16.777'),
('cmltm70a2000lu26obbgucavl', 'timelogs.delete_own', 'Xóa thời gian của mình', NULL, 'TIMELOGS', '2026-02-19 15:27:16.778'),
('cmltm70a3000mu26osuyvrrkh', 'projects.create', 'Tạo dự án', NULL, 'PROJECTS', '2026-02-19 15:27:16.780'),
('cmltm70a5000nu26ofdc2pb5j', 'projects.edit', 'Sửa dự án', NULL, 'PROJECTS', '2026-02-19 15:27:16.781'),
('cmltm70a6000ou26oqjwd5k01', 'projects.archive', 'Lưu trữ dự án', NULL, 'PROJECTS', '2026-02-19 15:27:16.782'),
('cmltm70a7000pu26o38kcr4l5', 'projects.delete', 'Xóa dự án', NULL, 'PROJECTS', '2026-02-19 15:27:16.784'),
('cmltm70a8000qu26ocrwmz5b6', 'projects.manage_members', 'Quản lý thành viên', NULL, 'PROJECTS', '2026-02-19 15:27:16.785'),
('cmltm70aa000ru26oo0whm76j', 'projects.manage_versions', 'Quản lý phiên bản', NULL, 'PROJECTS', '2026-02-19 15:27:16.786'),
('cmltm70ab000su26ou4xxqaxj', 'projects.manage_trackers', 'Quản lý loại công việc', NULL, 'PROJECTS', '2026-02-19 15:27:16.788'),
('cmltm70ae000uu26ofp3z8r0e', 'queries.manage_public', 'Quản lý bộ lọc công khai', NULL, 'QUERIES', '2026-02-19 15:27:16.790'),
('cmlttril90000u2y0v5nrqk67', 'tasks.assign_others', 'Giao việc cho người khác', NULL, 'TASKS', '2026-02-19 18:59:10.941');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `priorities`
--

CREATE TABLE `priorities` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `color` varchar(191) DEFAULT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `priorities`
--

INSERT INTO `priorities` (`id`, `name`, `position`, `color`, `isDefault`, `createdAt`, `updatedAt`) VALUES
('cmltm70ao0013u26odgot0j0n', 'Bình thường', 2, '#3b82f6', 1, '2026-02-19 15:27:16.801', '2026-02-19 15:27:16.801'),
('cmltm70ao0014u26o0f5rhmho', 'Thấp', 1, '#94a3b8', 0, '2026-02-19 15:27:16.801', '2026-02-19 15:27:16.801'),
('cmltm70ao0015u26o7zhbxbl1', 'Cao', 3, '#f59e0b', 0, '2026-02-19 15:27:16.801', '2026-02-19 15:27:16.801'),
('cmltm70ao0016u26of7fni55z', 'Khẩn cấp', 4, '#ef4444', 0, '2026-02-19 15:27:16.801', '2026-02-19 15:27:16.801');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `projects`
--

CREATE TABLE `projects` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `identifier` varchar(191) NOT NULL,
  `startDate` datetime(3) DEFAULT NULL,
  `endDate` datetime(3) DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  `creatorId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `projects`
--

INSERT INTO `projects` (`id`, `name`, `description`, `identifier`, `startDate`, `endDate`, `isArchived`, `creatorId`, `createdAt`, `updatedAt`, `isPublic`) VALUES
('cmmastr420005u2usj6r5aukn', 'Thư viện mầm non', 'Dự án thư viện số', 'tvmn', NULL, NULL, 0, 'cmltm70dd002ku26omn2zqhha', '2026-03-03 16:05:00.674', '2026-03-03 16:05:00.674', 0),
('cmmasuiwe000eu2uslkbmqqy6', 'Quản lý công việc nội bộ công ty BKT', 'Trang ghi task công ty', 'qlcv', NULL, NULL, 0, 'cmltm70dd002ku26omn2zqhha', '2026-03-03 16:05:36.686', '2026-03-03 16:05:36.686', 0),
('cmmasvkzf000nu2us8n557m7c', 'Hệ thống bài giảng BKT', 'Trang bài giảng', 'htbg', NULL, NULL, 0, 'cmltm70dd002ku26omn2zqhha', '2026-03-03 16:06:26.043', '2026-03-03 16:06:26.043', 0),
('cmmeau5b20001u2tc8kgapai5', 'aaaa', 'aaa', 'a', NULL, NULL, 1, 'cmltm70dd002ku26omn2zqhha', '2026-03-06 02:52:30.685', '2026-03-06 03:55:14.034', 0),
('cmmfou6mh0005u2uwz7n5h1lw', 'Hệ thống quản lý công việc', '', 'htqlcv', NULL, NULL, 0, 'cmmasfn2l0000u2usqqrndb3w', '2026-03-07 02:12:13.194', '2026-03-07 02:12:13.194', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `project_members`
--

CREATE TABLE `project_members` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `project_members`
--

INSERT INTO `project_members` (`id`, `projectId`, `userId`, `roleId`, `createdAt`, `updatedAt`) VALUES
('cmmastr420007u2uso7bju70m', 'cmmastr420005u2usj6r5aukn', 'cmltm70dd002ku26omn2zqhha', 'cmltm70av001au26oj0h9cme8', '2026-03-03 16:05:00.674', '2026-03-03 16:05:00.674'),
('cmmasuiwe000gu2usqg53alxt', 'cmmasuiwe000eu2uslkbmqqy6', 'cmltm70dd002ku26omn2zqhha', 'cmltm70av001au26oj0h9cme8', '2026-03-03 16:05:36.686', '2026-03-03 16:05:36.686'),
('cmmasvkzf000pu2us2ezhxnyw', 'cmmasvkzf000nu2us8n557m7c', 'cmltm70dd002ku26omn2zqhha', 'cmltm70av001au26oj0h9cme8', '2026-03-03 16:06:26.043', '2026-03-03 16:06:26.043'),
('cmmaszr4b000vu2uskfczr1zi', 'cmmasvkzf000nu2us8n557m7c', 'cmmasfn2l0000u2usqqrndb3w', 'cmltm70av001au26oj0h9cme8', '2026-03-03 16:09:40.619', '2026-03-03 16:09:40.619'),
('cmmat020c000yu2us7vqjl42x', 'cmmasuiwe000eu2uslkbmqqy6', 'cmmasfn2l0000u2usqqrndb3w', 'cmltm70av001au26oj0h9cme8', '2026-03-03 16:09:54.733', '2026-03-03 16:09:54.733'),
('cmmat0dzd0011u2us4ys3zjk5', 'cmmastr420005u2usj6r5aukn', 'cmmasfn2l0000u2usqqrndb3w', 'cmltm70av001au26oj0h9cme8', '2026-03-03 16:10:10.249', '2026-03-03 16:10:10.249'),
('cmmavu547001lu2usi6o0blw1', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmltm70ax001bu26o5auz09pv', '2026-03-03 17:29:17.671', '2026-03-03 17:29:17.671'),
('cmmavudgd001ou2uscu5iqfmj', 'cmmasvkzf000nu2us8n557m7c', 'cmmasget30002u2uscx10t258', 'cmmagquw1001lu2jsonqjhkuc', '2026-03-03 17:29:28.477', '2026-03-03 17:29:28.477'),
('cmmavuigb001ru2usfk22lf04', 'cmmasvkzf000nu2us8n557m7c', 'cmmasg2610001u2us3vcic1ld', 'cmmagleh0000wu2jsph0fj4mz', '2026-03-03 17:29:34.956', '2026-03-03 17:29:34.956'),
('cmmavur8c001uu2usbbemfm9f', 'cmmasuiwe000eu2uslkbmqqy6', 'cmmasgund0003u2us3ze0elku', 'cmltm70ax001bu26o5auz09pv', '2026-03-03 17:29:46.333', '2026-03-03 17:29:46.333'),
('cmmavv00j001xu2usu5ieiwq9', 'cmmasuiwe000eu2uslkbmqqy6', 'cmmasget30002u2uscx10t258', 'cmmagquw1001lu2jsonqjhkuc', '2026-03-03 17:29:57.716', '2026-03-03 17:29:57.716'),
('cmmavv3ag0020u2use0t478sx', 'cmmasuiwe000eu2uslkbmqqy6', 'cmmasg2610001u2us3vcic1ld', 'cmmagleh0000wu2jsph0fj4mz', '2026-03-03 17:30:01.961', '2026-03-03 17:30:01.961'),
('cmmavvjv90023u2usqemxrs49', 'cmmastr420005u2usj6r5aukn', 'cmmasgund0003u2us3ze0elku', 'cmltm70ax001bu26o5auz09pv', '2026-03-03 17:30:23.446', '2026-03-03 17:30:23.446'),
('cmmavvobd0026u2usg8b6uaso', 'cmmastr420005u2usj6r5aukn', 'cmmasget30002u2uscx10t258', 'cmmagquw1001lu2jsonqjhkuc', '2026-03-03 17:30:29.209', '2026-03-03 17:30:29.209'),
('cmmavvqr60029u2usb4dpr17d', 'cmmastr420005u2usj6r5aukn', 'cmmasg2610001u2us3vcic1ld', 'cmmagleh0000wu2jsph0fj4mz', '2026-03-03 17:30:32.371', '2026-03-03 17:30:32.371'),
('cmmeau5b20003u2tcnsfkghvj', 'cmmeau5b20001u2tc8kgapai5', 'cmltm70dd002ku26omn2zqhha', 'cmltm70av001au26oj0h9cme8', '2026-03-06 02:52:30.685', '2026-03-06 02:52:30.685'),
('cmmed1wi0000ju2tcwnkvmoi0', 'cmmeau5b20001u2tc8kgapai5', 'cmmasg2610001u2us3vcic1ld', 'cmmagquw1001lu2jsonqjhkuc', '2026-03-06 03:54:31.753', '2026-03-06 03:54:31.753'),
('cmmfou6mi0007u2uw0pmz36e3', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmasfn2l0000u2usqqrndb3w', 'cmltm70av001au26oj0h9cme8', '2026-03-07 02:12:13.194', '2026-03-07 02:12:13.194');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `project_trackers`
--

CREATE TABLE `project_trackers` (
  `id` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `trackerId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `project_trackers`
--

INSERT INTO `project_trackers` (`id`, `projectId`, `trackerId`, `createdAt`) VALUES
('cmmeau5br0004u2tco1vidkqs', 'cmmeau5b20001u2tc8kgapai5', 'cmmavmwhu0019u2us4eu1my98', '2026-03-06 02:52:30.712'),
('cmmeau5bs0005u2tcdnnelnmn', 'cmmeau5b20001u2tc8kgapai5', 'cmmavng2p001au2us66knhxra', '2026-03-06 02:52:30.712'),
('cmmeau5bs0006u2tc912vlmjx', 'cmmeau5b20001u2tc8kgapai5', 'cmmavo1m5001bu2usnfyhggnb', '2026-03-06 02:52:30.712'),
('cmmeau5bs0007u2tcfx6scrsm', 'cmmeau5b20001u2tc8kgapai5', 'cmmavofuj001cu2usp56pl9t5', '2026-03-06 02:52:30.712'),
('cmmeau5bs0008u2tc6eb76yqt', 'cmmeau5b20001u2tc8kgapai5', 'cmmavoynq001du2us4cd6lm4w', '2026-03-06 02:52:30.712'),
('cmmeau5bs0009u2tcr5ydi4df', 'cmmeau5b20001u2tc8kgapai5', 'cmmavpgas001eu2usvlinsbu8', '2026-03-06 02:52:30.712'),
('cmmeau5bs000au2tcsjitl52r', 'cmmeau5b20001u2tc8kgapai5', 'cmmavpu1p001fu2usq671bjuo', '2026-03-06 02:52:30.712'),
('cmmeau5bs000bu2tc85ei0jst', 'cmmeau5b20001u2tc8kgapai5', 'cmmavq5z0001gu2usal4vkm5o', '2026-03-06 02:52:30.712'),
('cmmeau5bs000cu2tc5abskvdy', 'cmmeau5b20001u2tc8kgapai5', 'cmmavql6j001hu2ussnixyfkx', '2026-03-06 02:52:30.712'),
('cmmeau5bs000du2tca22hx35n', 'cmmeau5b20001u2tc8kgapai5', 'cmmavqwtf001iu2usq6wb8e6j', '2026-03-06 02:52:30.712'),
('cmmeau5bs000eu2tc3ahwj4g3', 'cmmeau5b20001u2tc8kgapai5', 'cmmavrflf001ju2uskmprtn7v', '2026-03-06 02:52:30.712'),
('cmmeau5bs000fu2tc1k2lm4p2', 'cmmeau5b20001u2tc8kgapai5', 'cmmavrtg9001ku2usbybuvk8j', '2026-03-06 02:52:30.712'),
('cmmeau5bs000gu2tcjup1a8yf', 'cmmeau5b20001u2tc8kgapai5', 'cmmbrpgep0000u2j0oaz71g0w', '2026-03-06 02:52:30.712'),
('cmmfou6mp0008u2uww9p1k0t3', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavmwhu0019u2us4eu1my98', '2026-03-07 02:12:13.201'),
('cmmfou6mp0009u2uw7f1v9qo3', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavng2p001au2us66knhxra', '2026-03-07 02:12:13.201'),
('cmmfou6mp000au2uwsvitzp7d', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavo1m5001bu2usnfyhggnb', '2026-03-07 02:12:13.201'),
('cmmfou6mp000bu2uw52032rg8', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavofuj001cu2usp56pl9t5', '2026-03-07 02:12:13.201'),
('cmmfou6mp000cu2uw36v8iy1m', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavoynq001du2us4cd6lm4w', '2026-03-07 02:12:13.201'),
('cmmfou6mp000du2uwm58t2fnn', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavpgas001eu2usvlinsbu8', '2026-03-07 02:12:13.201'),
('cmmfou6mp000eu2uw5wwopodi', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavpu1p001fu2usq671bjuo', '2026-03-07 02:12:13.201'),
('cmmfou6mp000fu2uwe6imo71m', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavq5z0001gu2usal4vkm5o', '2026-03-07 02:12:13.201'),
('cmmfou6mp000gu2uw7nah95eh', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavql6j001hu2ussnixyfkx', '2026-03-07 02:12:13.201'),
('cmmfou6mp000hu2uw539mv2v3', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavqwtf001iu2usq6wb8e6j', '2026-03-07 02:12:13.201'),
('cmmfou6mp000iu2uwhe3pa8v4', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavrflf001ju2uskmprtn7v', '2026-03-07 02:12:13.201'),
('cmmfou6mp000ju2uwcg6msrkd', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmavrtg9001ku2usbybuvk8j', '2026-03-07 02:12:13.201'),
('cmmfou6mp000ku2uw6o6tqv0f', 'cmmfou6mh0005u2uwz7n5h1lw', 'cmmbrpgep0000u2j0oaz71g0w', '2026-03-07 02:12:13.201');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `queries`
--

CREATE TABLE `queries` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `projectId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT 0,
  `filters` text NOT NULL,
  `columns` text DEFAULT NULL,
  `sortBy` varchar(191) DEFAULT NULL,
  `sortOrder` varchar(191) DEFAULT 'asc',
  `groupBy` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `roles`
--

CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `assignable` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`, `assignable`) VALUES
('cmltm70av001au26oj0h9cme8', 'Manager', 'Quản lý toàn bộ dự án', 1, '2026-02-19 15:27:16.807', '2026-03-11 07:18:52.122', 1),
('cmltm70ax001bu26o5auz09pv', 'Developer', 'Thực hiện các công việc kỹ thuật', 1, '2026-02-19 15:27:16.810', '2026-03-06 08:34:44.767', 1),
('cmmagleh0000wu2jsph0fj4mz', 'Tester', 'Thực hiện các công việc kiểm thử', 1, '2026-03-03 10:22:35.652', '2026-03-04 17:16:41.596', 1),
('cmmagquw1001lu2jsonqjhkuc', 'Data Processor', 'Thực hiện các công việc dữ liệu', 1, '2026-03-03 10:26:50.209', '2026-03-04 17:16:53.420', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`, `createdAt`) VALUES
('cmmcatsep001fu2740pnhs9de', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709a0002u26o9ejdegm2', '2026-03-04 17:16:41.618'),
('cmmcatsep001gu274ijuvkvpx', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709b0003u26oc0fgyk7e', '2026-03-04 17:16:41.618'),
('cmmcatsep001hu274vgzlrwb1', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709g0006u26obaz0nmwk', '2026-03-04 17:16:41.618'),
('cmmcatsep001iu274ifw7rowe', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709i0008u26oqv082jju', '2026-03-04 17:16:41.618'),
('cmmcatsep001ju274yw3tb2c6', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709l000au26odw2lljrt', '2026-03-04 17:16:41.618'),
('cmmcatsep001ku274fy5nrha8', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709n000bu26orl9i64rj', '2026-03-04 17:16:41.618'),
('cmmcatsep001lu2744178htvq', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709p000du26ot0p3loue', '2026-03-04 17:16:41.618'),
('cmmcatsep001mu274nqqp06zr', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709s000fu26okxnq0l2s', '2026-03-04 17:16:41.618'),
('cmmcatsep001nu274p0zbxcox', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709v000hu26oj8sd7kl0', '2026-03-04 17:16:41.618'),
('cmmcatsep001ou274dmfospe3', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709z000ju26osfx5rrek', '2026-03-04 17:16:41.618'),
('cmmcatsep001pu274rdsdub72', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm70a2000lu26obbgucavl', '2026-03-04 17:16:41.618'),
('cmmcatsep001qu274irzvbmn5', 'cmmagleh0000wu2jsph0fj4mz', 'cmltm709e0005u26oqfzjcjcm', '2026-03-04 17:16:41.618'),
('cmmcau1j60023u274412rcy3u', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709a0002u26o9ejdegm2', '2026-03-04 17:16:53.442'),
('cmmcau1j60024u274varfh4b3', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709b0003u26oc0fgyk7e', '2026-03-04 17:16:53.442'),
('cmmcau1j60025u274imc9mkv5', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709g0006u26obaz0nmwk', '2026-03-04 17:16:53.442'),
('cmmcau1j60026u2741em0ed4i', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709i0008u26oqv082jju', '2026-03-04 17:16:53.442'),
('cmmcau1j60027u274wrmwodv0', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709l000au26odw2lljrt', '2026-03-04 17:16:53.442'),
('cmmcau1j60028u274g5589485', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709n000bu26orl9i64rj', '2026-03-04 17:16:53.442'),
('cmmcau1j60029u274ka1hoc1m', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709p000du26ot0p3loue', '2026-03-04 17:16:53.442'),
('cmmcau1j6002au274kz3abc0h', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709s000fu26okxnq0l2s', '2026-03-04 17:16:53.442'),
('cmmcau1j6002bu274clh8n5hy', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709v000hu26oj8sd7kl0', '2026-03-04 17:16:53.442'),
('cmmcau1j6002cu274axzw5xbq', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709z000ju26osfx5rrek', '2026-03-04 17:16:53.442'),
('cmmcau1j6002du274wpbr6w62', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm70a2000lu26obbgucavl', '2026-03-04 17:16:53.442'),
('cmmcau1j6002eu274qoea6gey', 'cmmagquw1001lu2jsonqjhkuc', 'cmltm709e0005u26oqfzjcjcm', '2026-03-04 17:16:53.442'),
('cmmen29jn0021u24ggktlzyvb', 'cmltm70ax001bu26o5auz09pv', 'cmltm709a0002u26o9ejdegm2', '2026-03-06 08:34:44.820'),
('cmmen29jn0022u24g4jds1dbi', 'cmltm70ax001bu26o5auz09pv', 'cmltm709g0006u26obaz0nmwk', '2026-03-06 08:34:44.820'),
('cmmen29jn0023u24g04a9kao7', 'cmltm70ax001bu26o5auz09pv', 'cmltm709i0008u26oqv082jju', '2026-03-06 08:34:44.820'),
('cmmen29jn0024u24gjfmkm86c', 'cmltm70ax001bu26o5auz09pv', 'cmltm709l000au26odw2lljrt', '2026-03-06 08:34:44.820'),
('cmmen29jn0025u24g69us98s5', 'cmltm70ax001bu26o5auz09pv', 'cmltm709n000bu26orl9i64rj', '2026-03-06 08:34:44.820'),
('cmmen29jn0026u24gpfcxpcuu', 'cmltm70ax001bu26o5auz09pv', 'cmltm709p000du26ot0p3loue', '2026-03-06 08:34:44.820'),
('cmmen29jo0027u24gbv0r221e', 'cmltm70ax001bu26o5auz09pv', 'cmltm709s000fu26okxnq0l2s', '2026-03-06 08:34:44.820'),
('cmmen29jo0028u24gfdtk9jji', 'cmltm70ax001bu26o5auz09pv', 'cmltm709v000hu26oj8sd7kl0', '2026-03-06 08:34:44.820'),
('cmmen29jo0029u24gs6glhsti', 'cmltm70ax001bu26o5auz09pv', 'cmltm709z000ju26osfx5rrek', '2026-03-06 08:34:44.820'),
('cmmen29jo002au24gd4ohkec9', 'cmltm70ax001bu26o5auz09pv', 'cmltm70a2000lu26obbgucavl', '2026-03-06 08:34:44.820'),
('cmmen29jo002bu24gjw7udyw1', 'cmltm70ax001bu26o5auz09pv', 'cmltm709e0005u26oqfzjcjcm', '2026-03-06 08:34:44.820'),
('cmmen29jo002cu24gqs2ymy10', 'cmltm70ax001bu26o5auz09pv', 'cmltm709k0009u26ony5d3ktv', '2026-03-06 08:34:44.820'),
('cmmen29jo002du24g1x6a0zf9', 'cmltm70ax001bu26o5auz09pv', 'cmltm709b0003u26oc0fgyk7e', '2026-03-06 08:34:44.820'),
('cmmlpjyrv0000u2aog1buhu6m', 'cmltm70av001au26oj0h9cme8', 'cmltm70960000u26occe6hv9s', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0001u2aoj9p6mqtw', 'cmltm70av001au26oj0h9cme8', 'cmltm70980001u26oiug0m2xk', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0002u2ao6fhcppg7', 'cmltm70av001au26oj0h9cme8', 'cmltm709a0002u26o9ejdegm2', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0003u2aoobrbg07f', 'cmltm70av001au26oj0h9cme8', 'cmltm709b0003u26oc0fgyk7e', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0004u2ao5nf23927', 'cmltm70av001au26oj0h9cme8', 'cmltm709d0004u26o5nmlk31y', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0005u2aod648m3ao', 'cmltm70av001au26oj0h9cme8', 'cmltm709e0005u26oqfzjcjcm', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0006u2aoiho5mkgt', 'cmltm70av001au26oj0h9cme8', 'cmltm709g0006u26obaz0nmwk', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0007u2aox8k3i5gh', 'cmltm70av001au26oj0h9cme8', 'cmltm709h0007u26ocwk2gao7', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0008u2aokizd0iu3', 'cmltm70av001au26oj0h9cme8', 'cmltm709i0008u26oqv082jju', '2026-03-11 07:18:53.131'),
('cmmlpjyrw0009u2aosoqkigym', 'cmltm70av001au26oj0h9cme8', 'cmltm709k0009u26ony5d3ktv', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000au2ao0entrc54', 'cmltm70av001au26oj0h9cme8', 'cmltm709l000au26odw2lljrt', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000bu2aonndi8ts3', 'cmltm70av001au26oj0h9cme8', 'cmltm709n000bu26orl9i64rj', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000cu2aoy7vnc7h9', 'cmltm70av001au26oj0h9cme8', 'cmltm709o000cu26ozzaw8u9w', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000du2aott4qg2kb', 'cmltm70av001au26oj0h9cme8', 'cmltm709p000du26ot0p3loue', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000eu2aot8icjc0f', 'cmltm70av001au26oj0h9cme8', 'cmltm709r000eu26okwhhpxcf', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000fu2aonwq9j4x5', 'cmltm70av001au26oj0h9cme8', 'cmltm709s000fu26okxnq0l2s', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000gu2aorq9czywl', 'cmltm70av001au26oj0h9cme8', 'cmltm709t000gu26ohlylcilj', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000hu2aohq546u34', 'cmltm70av001au26oj0h9cme8', 'cmltm709v000hu26oj8sd7kl0', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000iu2aodok6fsc5', 'cmltm70av001au26oj0h9cme8', 'cmltm709w000iu26omre1p5oh', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000ju2ao4bo96are', 'cmltm70av001au26oj0h9cme8', 'cmltm709z000ju26osfx5rrek', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000ku2aouofemx2g', 'cmltm70av001au26oj0h9cme8', 'cmltm70a0000ku26oeari7k5m', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000lu2ao3gmwwyip', 'cmltm70av001au26oj0h9cme8', 'cmltm70a2000lu26obbgucavl', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000mu2aoevf0hmww', 'cmltm70av001au26oj0h9cme8', 'cmltm70ae000uu26ofp3z8r0e', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000nu2aorso1wnv0', 'cmltm70av001au26oj0h9cme8', 'cmltm70a6000ou26oqjwd5k01', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000ou2aovupzs8r4', 'cmltm70av001au26oj0h9cme8', 'cmltm70ab000su26ou4xxqaxj', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000pu2ao5jpmyli7', 'cmltm70av001au26oj0h9cme8', 'cmltm70aa000ru26oo0whm76j', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000qu2ao0a5m9f1z', 'cmltm70av001au26oj0h9cme8', 'cmltm70a8000qu26ocrwmz5b6', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000ru2aoirfgnqr3', 'cmltm70av001au26oj0h9cme8', 'cmltm70a5000nu26ofdc2pb5j', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000su2ao6lwgp8qp', 'cmltm70av001au26oj0h9cme8', 'cmltm70a7000pu26o38kcr4l5', '2026-03-11 07:18:53.131'),
('cmmlpjyrw000tu2aorab52ij4', 'cmltm70av001au26oj0h9cme8', 'cmltm70a3000mu26osuyvrrkh', '2026-03-11 07:18:53.131');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `role_trackers`
--

CREATE TABLE `role_trackers` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `trackerId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `role_trackers`
--

INSERT INTO `role_trackers` (`id`, `roleId`, `trackerId`, `createdAt`) VALUES
('cmmavw2jm002cu2usik7dqdzm', 'cmltm70ax001bu26o5auz09pv', 'cmmavmwhu0019u2us4eu1my98', '2026-03-03 17:30:47.651'),
('cmmavw2jm002du2usn51zzbk0', 'cmltm70ax001bu26o5auz09pv', 'cmmavng2p001au2us66knhxra', '2026-03-03 17:30:47.651'),
('cmmavw2jm002eu2usylxgdfxx', 'cmltm70ax001bu26o5auz09pv', 'cmmavo1m5001bu2usnfyhggnb', '2026-03-03 17:30:47.651'),
('cmmavw2jm002fu2usi95j3iru', 'cmltm70ax001bu26o5auz09pv', 'cmmavofuj001cu2usp56pl9t5', '2026-03-03 17:30:47.651'),
('cmmavwixs002gu2us74mq5obp', 'cmmagquw1001lu2jsonqjhkuc', 'cmmavql6j001hu2ussnixyfkx', '2026-03-03 17:31:08.897'),
('cmmavwixs002hu2ussswpv7gn', 'cmmagquw1001lu2jsonqjhkuc', 'cmmavqwtf001iu2usq6wb8e6j', '2026-03-03 17:31:08.897'),
('cmmavwixs002iu2usw4pkewl9', 'cmmagquw1001lu2jsonqjhkuc', 'cmmavrflf001ju2uskmprtn7v', '2026-03-03 17:31:08.897'),
('cmmavwixs002ju2us9gp69zyl', 'cmmagquw1001lu2jsonqjhkuc', 'cmmavrtg9001ku2usbybuvk8j', '2026-03-03 17:31:08.897'),
('cmmavwvg7002ku2uspog7ntiy', 'cmmagleh0000wu2jsph0fj4mz', 'cmmavoynq001du2us4cd6lm4w', '2026-03-03 17:31:25.112'),
('cmmavwvg7002lu2uscazvfoyy', 'cmmagleh0000wu2jsph0fj4mz', 'cmmavpgas001eu2usvlinsbu8', '2026-03-03 17:31:25.112'),
('cmmavwvg7002mu2usfu29aju8', 'cmmagleh0000wu2jsph0fj4mz', 'cmmavpu1p001fu2usq671bjuo', '2026-03-03 17:31:25.112'),
('cmmavwvg7002nu2usiqborg2z', 'cmmagleh0000wu2jsph0fj4mz', 'cmmavq5z0001gu2usal4vkm5o', '2026-03-03 17:31:25.112'),
('cmmbrs0r10001u2j0i5zmg2ib', 'cmltm70av001au26oj0h9cme8', 'cmmbrpgep0000u2j0oaz71g0w', '2026-03-04 08:23:26.413');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `statuses`
--

CREATE TABLE `statuses` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `isClosed` tinyint(1) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `defaultDoneRatio` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `statuses`
--

INSERT INTO `statuses` (`id`, `name`, `description`, `position`, `isClosed`, `isDefault`, `createdAt`, `updatedAt`, `defaultDoneRatio`) VALUES
('cmltm70ak000yu26obbti3jjz', 'Mới', NULL, 1, 0, 1, '2026-02-19 15:27:16.796', '2026-03-04 09:57:53.824', NULL),
('cmltm70ak000zu26osulp9e23', 'Đang làm', NULL, 2, 0, 0, '2026-02-19 15:27:16.796', '2026-03-04 09:57:53.821', NULL),
('cmltm70al0011u26oqip1qd6q', 'Đóng', '', 5, 1, 0, '2026-02-19 15:27:16.797', '2026-03-05 02:22:24.292', 100),
('cmltm70al0012u26on2c5mamw', 'Chờ kiểm thử', '', 4, 0, 0, '2026-02-19 15:27:16.797', '2026-03-03 16:50:06.522', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `trackerId` varchar(191) NOT NULL,
  `statusId` varchar(191) NOT NULL,
  `priorityId` varchar(191) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `assigneeId` varchar(191) DEFAULT NULL,
  `creatorId` varchar(191) NOT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `path` varchar(191) DEFAULT NULL,
  `level` int(11) NOT NULL DEFAULT 0,
  `estimatedHours` double DEFAULT NULL,
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `doneRatio` int(11) NOT NULL DEFAULT 0,
  `isPrivate` tinyint(1) NOT NULL DEFAULT 0,
  `lockVersion` int(11) NOT NULL DEFAULT 0,
  `startDate` datetime(3) DEFAULT NULL,
  `versionId` varchar(191) DEFAULT NULL,
  `number` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `tasks`
--

INSERT INTO `tasks` (`id`, `title`, `description`, `trackerId`, `statusId`, `priorityId`, `projectId`, `assigneeId`, `creatorId`, `parentId`, `path`, `level`, `estimatedHours`, `dueDate`, `createdAt`, `updatedAt`, `doneRatio`, `isPrivate`, `lockVersion`, `startDate`, `versionId`, `number`) VALUES
('cmmcaso35001au274wg6r6ymb', 'Đọc, nghiên cứu tài liệu BA dự án', '', 'cmmbrpgep0000u2j0oaz71g0w', 'cmltm70al0012u26on2c5mamw', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasfn2l0000u2usqqrndb3w', NULL, NULL, 0, 24, '2026-03-05 00:00:00.000', '2026-03-04 17:15:49.361', '2026-03-07 02:25:01.111', 0, 0, 8, '2026-03-01 00:00:00.000', NULL, 134),
('cmmcsyff3004tu27sx16opkkx', 'Thiết kế, code giao diện FE cho hệ thống', '', 'cmmbrpgep0000u2j0oaz71g0w', 'cmltm70al0011u26oqip1qd6q', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasfn2l0000u2usqqrndb3w', NULL, NULL, 0, NULL, '2026-03-04 00:00:00.000', '2026-03-05 01:44:11.151', '2026-03-07 01:45:10.530', 100, 0, 11, '2026-03-01 00:00:00.000', 'cmmenleny002fu24g0yu3owsd', 136),
('cmmctuf7q0057u27sdp6n9ja7', 'Lập danh sách testcase dự án', '', 'cmmbrpgep0000u2j0oaz71g0w', 'cmltm70ak000zu26osulp9e23', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasg2610001u2us3vcic1ld', 'cmmasfn2l0000u2usqqrndb3w', NULL, NULL, 0, 24, '2026-03-04 00:00:00.000', '2026-03-05 02:09:03.878', '2026-03-05 09:28:37.698', 57, 0, 9, '2026-03-01 00:00:00.000', NULL, 137),
('cmmctvzi1005du27stddqnnwz', 'Làm 20 bài giảng data cho hệ thống', '', 'cmmbrpgep0000u2j0oaz71g0w', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasget30002u2uscx10t258', 'cmmasfn2l0000u2usqqrndb3w', NULL, NULL, 0, NULL, '2026-03-03 00:00:00.000', '2026-03-05 02:10:16.825', '2026-03-05 02:10:16.825', 0, 0, 0, '2026-03-01 00:00:00.000', NULL, 138),
('cmmcumpxq0001u2t8d6vwqful', 'Đọc tài liệu yêu cầu chức năng hệ thống', '', 'cmmavmwhu0019u2us4eu1my98', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasgund0003u2us3ze0elku', 'cmmcaso35001au274wg6r6ymb', 'cmmcaso35001au274wg6r6ymb', 1, 8, '2026-03-02 00:00:00.000', '2026-03-05 02:31:04.142', '2026-03-05 09:35:58.803', 0, 0, 3, '2026-03-01 00:00:00.000', NULL, 139),
('cmmcuszk00007u2t8zqilzb7j', 'Đọc tài liệu database hệ thống ', '', 'cmmavmwhu0019u2us4eu1my98', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasgund0003u2us3ze0elku', 'cmmcaso35001au274wg6r6ymb', 'cmmcaso35001au274wg6r6ymb', 1, 16, '2026-03-05 00:00:00.000', '2026-03-05 02:35:56.544', '2026-03-05 09:36:00.513', 0, 0, 2, '2026-03-03 00:00:00.000', NULL, 140),
('cmmcv5egf0001u2k0hofp3b7y', 'code giao diện đăng nhập, đăng ký', '', 'cmmavng2p001au2us66knhxra', 'cmltm70al0011u26oqip1qd6q', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasgund0003u2us3ze0elku', 'cmmcsyff3004tu27sx16opkkx', 'cmmcsyff3004tu27sx16opkkx', 1, NULL, '2026-03-02 00:00:00.000', '2026-03-05 02:45:35.727', '2026-03-05 10:27:17.783', 100, 0, 17, '2026-03-01 00:00:00.000', NULL, 141),
('cmmcv73jt0005u2k006pa6ra3', 'code giao diện công việc (kanban, list)', '', 'cmmavng2p001au2us66knhxra', 'cmltm70al0011u26oqip1qd6q', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasgund0003u2us3ze0elku', 'cmmcsyff3004tu27sx16opkkx', 'cmmcsyff3004tu27sx16opkkx', 1, NULL, '2026-03-04 00:00:00.000', '2026-03-05 02:46:54.905', '2026-03-05 04:42:38.708', 100, 0, 5, '2026-03-02 00:00:00.000', NULL, 142),
('cmmd462e40005u2wgihinc7mw', 'Thiết kế file test', '', 'cmmavoynq001du2us4cd6lm4w', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasg2610001u2us3vcic1ld', 'cmmasg2610001u2us3vcic1ld', 'cmmctuf7q0057u27sdp6n9ja7', 'cmmctuf7q0057u27sdp6n9ja7', 1, 16, '2026-03-02 00:00:00.000', '2026-03-05 06:58:03.293', '2026-03-05 06:58:03.293', 50, 0, 0, '2026-03-01 00:00:00.000', NULL, 144),
('cmmd49jof0009u2wgh6htqluy', 'Thiết kế nội dung test case', '', 'cmmavoynq001du2us4cd6lm4w', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasg2610001u2us3vcic1ld', 'cmmasg2610001u2us3vcic1ld', 'cmmctuf7q0057u27sdp6n9ja7', 'cmmctuf7q0057u27sdp6n9ja7', 1, 8, '2026-03-04 00:00:00.000', '2026-03-05 07:00:45.663', '2026-03-05 07:01:39.616', 70, 0, 1, '2026-03-02 00:00:00.000', NULL, 145),
('cmmed2cyk000nu2tcxx5rm1ua', 'bbbb', '', 'cmmavmwhu0019u2us4eu1my98', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmeau5b20001u2tc8kgapai5', 'cmmasg2610001u2us3vcic1ld', 'cmltm70dd002ku26omn2zqhha', NULL, NULL, 0, NULL, NULL, '2026-03-06 03:54:53.085', '2026-03-06 03:54:53.085', 0, 0, 0, NULL, NULL, 148),
('cmmedec4m000tu2tcx4z9b59d', 'Code backend hệ thống bài giảng', 'Dùng nextjs 16, typescript, prisma mysql', 'cmmbrpgep0000u2j0oaz71g0w', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasfn2l0000u2usqqrndb3w', NULL, NULL, 0, NULL, '2026-03-12 00:00:00.000', '2026-03-06 04:04:11.878', '2026-03-06 04:04:11.878', 0, 0, 0, '2026-03-06 00:00:00.000', NULL, 149),
('cmmfncnww0001u2y0irona5ro', 'Xây dựng test case FE', '', 'cmmavoynq001du2us4cd6lm4w', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasg2610001u2us3vcic1ld', 'cmmasg2610001u2us3vcic1ld', NULL, NULL, 0, 16, '2026-03-09 00:00:00.000', '2026-03-07 01:30:36.175', '2026-03-07 01:30:36.175', 0, 0, 0, '2026-03-07 00:00:00.000', NULL, 150),
('cmmfnwp980007u2hgettvvyk6', 'Fix lỗi giao diện bài giảng', '', 'cmmavo1m5001bu2usnfyhggnb', 'cmltm70ak000yu26obbti3jjz', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasgund0003u2us3ze0elku', 'cmmasgund0003u2us3ze0elku', NULL, NULL, 0, NULL, '2026-03-08 00:00:00.000', '2026-03-07 01:46:11.036', '2026-03-07 02:11:29.806', 0, 0, 2, '2026-03-07 00:00:00.000', 'cmmenleny002fu24g0yu3owsd', 151),
('cmmfo5n46000du2hga2zr7bly', 'Báo cáo test', '', 'cmmavq5z0001gu2usal4vkm5o', 'cmltm70al0011u26oqip1qd6q', 'cmltm70ao0013u26odgot0j0n', 'cmmasvkzf000nu2us8n557m7c', 'cmmasg2610001u2us3vcic1ld', 'cmmasg2610001u2us3vcic1ld', NULL, NULL, 0, 2, '2026-03-08 00:00:00.000', '2026-03-07 01:53:08.166', '2026-03-07 01:53:11.689', 100, 0, 1, '2026-03-07 00:00:00.000', 'cmmenleny002fu24g0yu3owsd', 152);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `time_entry_activities`
--

CREATE TABLE `time_entry_activities` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `time_entry_activities`
--

INSERT INTO `time_entry_activities` (`id`, `name`, `position`, `isDefault`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmmat4xa80014u2us01wv4far', 'Kỹ thuật', 0, 0, 1, '2026-03-03 16:13:41.888', '2026-03-07 02:07:23.313'),
('cmmat51ne0015u2usqihayscp', 'Thiết kế', 1, 1, 1, '2026-03-03 16:13:47.547', '2026-03-07 02:07:24.264'),
('cmmat57t00016u2us273oxdy9', 'Kiểm thử', 2, 0, 1, '2026-03-03 16:13:55.525', '2026-03-07 02:07:24.198'),
('cmmat5j5f0017u2usiwxd64i2', 'Tìm hiểu', 3, 0, 1, '2026-03-03 16:14:10.228', '2026-03-07 02:07:00.482');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `time_logs`
--

CREATE TABLE `time_logs` (
  `id` varchar(191) NOT NULL,
  `hours` double NOT NULL,
  `comments` text DEFAULT NULL,
  `spentOn` datetime(3) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `taskId` varchar(191) DEFAULT NULL,
  `projectId` varchar(191) NOT NULL,
  `activityId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `time_logs`
--

INSERT INTO `time_logs` (`id`, `hours`, `comments`, `spentOn`, `userId`, `taskId`, `projectId`, `activityId`, `createdAt`, `updatedAt`) VALUES
('cmmcydpce000ju2e88b98duzn', 2, NULL, '2026-03-05 00:00:00.000', 'cmmasgund0003u2us3ze0elku', 'cmmcv5egf0001u2k0hofp3b7y', 'cmmasvkzf000nu2us8n557m7c', 'cmmat4xa80014u2us01wv4far', '2026-03-05 04:16:01.934', '2026-03-05 04:16:01.934'),
('cmmcye1q4000lu2e8whm2dmxx', 3, NULL, '2026-03-05 00:00:00.000', 'cmmasgund0003u2us3ze0elku', 'cmmcv73jt0005u2k006pa6ra3', 'cmmasvkzf000nu2us8n557m7c', 'cmmat4xa80014u2us01wv4far', '2026-03-05 04:16:17.980', '2026-03-05 04:16:17.980');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `trackers`
--

CREATE TABLE `trackers` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `trackers`
--

INSERT INTO `trackers` (`id`, `name`, `description`, `position`, `isDefault`, `createdAt`, `updatedAt`) VALUES
('cmmavmwhu0019u2us4eu1my98', 'Research', 'Nghiên cứu - dev', 1, 0, '2026-03-03 17:23:39.906', '2026-03-03 17:23:39.906'),
('cmmavng2p001au2us66knhxra', 'Code Feature', 'Lập trình tính năng - dev', 2, 0, '2026-03-03 17:24:05.282', '2026-03-03 17:24:05.282'),
('cmmavo1m5001bu2usnfyhggnb', 'Fix bug', 'Sửa lỗi - dev', 3, 0, '2026-03-03 17:24:33.198', '2026-03-03 17:24:33.198'),
('cmmavofuj001cu2usp56pl9t5', 'Deploy', 'Triển khai - dev', 4, 0, '2026-03-03 17:24:51.643', '2026-03-03 17:24:51.643'),
('cmmavoynq001du2us4cd6lm4w', 'Test Planning', 'Lập kế hoạch kiểm thử - tester', 5, 0, '2026-03-03 17:25:16.022', '2026-03-03 17:25:16.022'),
('cmmavpgas001eu2usvlinsbu8', 'Test Design', 'Thiết kế test - tester', 6, 0, '2026-03-03 17:25:38.884', '2026-03-03 17:25:38.884'),
('cmmavpu1p001fu2usq671bjuo', 'Test Execution', 'Thực thi kiểm thử - tester', 7, 0, '2026-03-03 17:25:56.701', '2026-03-03 17:25:56.701'),
('cmmavq5z0001gu2usal4vkm5o', 'Test Report', 'Báo cáo kiểm thử - tester', 8, 0, '2026-03-03 17:26:12.156', '2026-03-03 17:26:12.156'),
('cmmavql6j001hu2ussnixyfkx', 'Data Planning', 'Lập kế hoạch dữ liệu - data', 9, 0, '2026-03-03 17:26:31.868', '2026-03-03 17:26:31.868'),
('cmmavqwtf001iu2usq6wb8e6j', 'Data Collection', 'Thu thập dữ liệu - data', 10, 0, '2026-03-03 17:26:46.948', '2026-03-03 17:26:53.795'),
('cmmavrflf001ju2uskmprtn7v', 'Data Building', 'Xây dựng dữ liệu - data', 11, 0, '2026-03-03 17:27:11.283', '2026-03-03 17:27:11.283'),
('cmmavrtg9001ku2usbybuvk8j', 'Data Report', 'Báo cáo dữ liệu - data', 12, 0, '2026-03-03 17:27:29.241', '2026-03-03 17:27:29.241'),
('cmmbrpgep0000u2j0oaz71g0w', 'Task', 'Công việc chính - PM', 13, 0, '2026-03-04 08:21:26.738', '2026-03-04 08:21:26.738');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `isAdministrator` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password`, `avatar`, `isAdministrator`, `isActive`, `createdAt`, `updatedAt`) VALUES
('cmltm70dd002ku26omn2zqhha', 'admin@worksphere.com', 'Quản trị hệ thống', '$2b$10$RqoFeJgFDpz/7ZTnLjTlR.rJ4NdY8FirPfQ9ujVqaqv1JEaZIDh0i', NULL, 1, 1, '2026-02-19 15:27:16.897', '2026-03-03 07:05:29.487'),
('cmmasfn2l0000u2usqqrndb3w', 'anh@worksphere.com', 'Lê Đức Anh', '$2b$10$buNQcTRLgnvitTuogpKbBOc4hflCqbwCZ6i2zDU8VQQU9bjZuhBL.', NULL, 0, 1, '2026-03-03 15:54:02.253', '2026-03-03 15:54:02.253'),
('cmmasg2610001u2us3vcic1ld', 'nha@worksphere.com', 'Nguyễn Đức Nhã', '$2b$10$QNi63xB/5glvuiH7teYmIejZzyCi.RcJvswhayQdXG3kaZPxLsmSK', NULL, 0, 1, '2026-03-03 15:54:21.817', '2026-03-03 15:54:21.817'),
('cmmasget30002u2uscx10t258', 'hai@worksphere.com', 'Nguyễn Đăng Hải', '$2b$10$2ESs5JFlMwcowyssLs6y0OF9SJYoW3x9Myh01C.6akdBPuUIYr8oS', NULL, 0, 1, '2026-03-03 15:54:38.199', '2026-03-03 15:54:38.199'),
('cmmasgund0003u2us3ze0elku', 'long@worksphere.com', 'Lê Tuấn Long', '$2b$10$H9HCaKFEm/gB4/gn16kk.ue/eM1BaYFDDcn7dlPSmuQH6PxnfLU/2', NULL, 0, 1, '2026-03-03 15:54:58.729', '2026-03-03 15:54:58.729');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `versions`
--

CREATE TABLE `versions` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'open',
  `dueDate` datetime(3) DEFAULT NULL,
  `projectId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `versions`
--

INSERT INTO `versions` (`id`, `name`, `description`, `status`, `dueDate`, `projectId`, `createdAt`, `updatedAt`) VALUES
('cmmenleny002fu24g0yu3owsd', 'Bài giảng V1', '', 'open', '2026-06-30 00:00:00.000', 'cmmasvkzf000nu2us8n557m7c', '2026-03-06 08:49:37.918', '2026-03-06 08:49:37.918');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `watchers`
--

CREATE TABLE `watchers` (
  `id` varchar(191) NOT NULL,
  `taskId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `workflow_transitions`
--

CREATE TABLE `workflow_transitions` (
  `id` varchar(191) NOT NULL,
  `trackerId` varchar(191) NOT NULL,
  `roleId` varchar(191) DEFAULT NULL,
  `fromStatusId` varchar(191) NOT NULL,
  `toStatusId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `workflow_transitions`
--

INSERT INTO `workflow_transitions` (`id`, `trackerId`, `roleId`, `fromStatusId`, `toStatusId`, `createdAt`) VALUES
('cmmcspoz50008u27s4rgl3cnn', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:23.634'),
('cmmcspoz50009u27sti41t3nh', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:23.634'),
('cmmcspoz5000au27s2c0dj30x', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:23.634'),
('cmmcspoz5000bu27s4jdt83r8', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:23.634'),
('cmmcspoz5000cu27su1b828n4', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:23.634'),
('cmmcspoz6000du27skqrrwcap', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:23.634'),
('cmmcspoz6000eu27sdw0yhamw', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:23.634'),
('cmmcspoz6000fu27sop1dlj1a', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:23.634'),
('cmmcspoz6000gu27sz4da979m', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:23.634'),
('cmmcspoz6000hu27sy4yz4bbx', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:23.634'),
('cmmcspoz6000iu27syz0fpxnx', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:23.634'),
('cmmcspoz6000ju27sb42ripqk', 'cmmavmwhu0019u2us4eu1my98', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:23.634'),
('cmmcspyri000ku27s5twf9np7', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:36.318'),
('cmmcspyri000lu27sifsufgec', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:36.318'),
('cmmcspyri000mu27srmt22rpy', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:36.318'),
('cmmcspyri000nu27s795figcf', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:36.318'),
('cmmcspyri000ou27svoaokb9a', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:36.318'),
('cmmcspyri000pu27sb2fst01b', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:36.318'),
('cmmcspyri000qu27svn7en2rg', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:36.318'),
('cmmcspyri000ru27soz518td0', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:36.318'),
('cmmcspyri000su27s7ypfdxme', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:36.318'),
('cmmcspyri000tu27s5g0109bm', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:36.318'),
('cmmcspyri000uu27sbgr5z7o7', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:36.318'),
('cmmcspyri000vu27stozndwdd', 'cmmavng2p001au2us66knhxra', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:36.318'),
('cmmcsq4nh000wu27shhguxykl', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:43.950'),
('cmmcsq4nh000xu27sv0ctch6d', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:43.950'),
('cmmcsq4ni000yu27segiineg7', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:43.950'),
('cmmcsq4ni000zu27s0k8h32uf', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0010u27sr16u1f7m', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0011u27s63kzjmsh', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0012u27s3xerka39', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0013u27sivwh3xvo', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0014u27s7tfa9wlm', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0015u27swam1lv3q', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0016u27s7ofre3td', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:43.950'),
('cmmcsq4ni0017u27s8si3eihi', 'cmmavo1m5001bu2usnfyhggnb', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:43.950'),
('cmmcsq8ou0018u27saweqng3n', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:49.182'),
('cmmcsq8ou0019u27s0w56f96q', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001au27s6qxri80d', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001bu27sjl9sobxo', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001cu27siwo6nlbt', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001du27ste3cu8hp', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001eu27sbrvuj4xn', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001fu27st9z6cxwc', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001gu27s22341gxe', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001hu27s8l7e3e87', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001iu27snf1f408m', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:49.182'),
('cmmcsq8ou001ju27suj0twjgj', 'cmmavofuj001cu2usp56pl9t5', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:49.182'),
('cmmcsqbvm001ku27sm3be1mg3', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001lu27sceub1y3l', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001mu27sozar1d2l', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001nu27sogg6we9c', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001ou27sg99rinpp', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001pu27smwnvim7j', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001qu27sxj14ique', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001ru27sj0pfqruh', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001su27sj9tgr9ea', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001tu27s1htoeani', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001uu27ssz8nyhpb', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:37:53.315'),
('cmmcsqbvm001vu27stcj4a3ox', 'cmmavoynq001du2us4cd6lm4w', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:37:53.315'),
('cmmcsqhh7001wu27sd59nuikc', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:00.571'),
('cmmcsqhh7001xu27slex7h2ov', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:00.571'),
('cmmcsqhh7001yu27s0eu5u8ro', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:00.571'),
('cmmcsqhh7001zu27scjhzxkag', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:00.571'),
('cmmcsqhh70020u27sq4e630ya', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:00.571'),
('cmmcsqhh70021u27schun23gx', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:00.571'),
('cmmcsqhh70022u27slbzs6xcy', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:00.571'),
('cmmcsqhh70023u27sg501f0xn', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:00.571'),
('cmmcsqhh70024u27sv700y60y', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:00.571'),
('cmmcsqhh70025u27sk28afkpt', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:00.571'),
('cmmcsqhh70026u27swalgc3b0', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:00.571'),
('cmmcsqhh70027u27sx1pmrc74', 'cmmavpgas001eu2usvlinsbu8', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:00.571'),
('cmmcsql790028u27seiqn0j5i', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:05.397'),
('cmmcsql790029u27s4pyli8sa', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:05.397'),
('cmmcsql79002au27spdj0bc3g', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:05.397'),
('cmmcsql79002bu27s5jm5u4bi', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:05.397'),
('cmmcsql79002cu27s7bobex0q', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:05.397'),
('cmmcsql79002du27shjbajpfm', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:05.397'),
('cmmcsql79002eu27svlbcmnbo', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:05.397'),
('cmmcsql79002fu27sv90vk9s2', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:05.397'),
('cmmcsql79002gu27suso0xw0h', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:05.397'),
('cmmcsql79002hu27sy4x7fmqc', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:05.397'),
('cmmcsql79002iu27sm8mh8fcs', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:05.397'),
('cmmcsql79002ju27sqjk9rzq9', 'cmmavpu1p001fu2usq671bjuo', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:05.397'),
('cmmcsqoa8002ku27sipp9nqtq', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002lu27s9rn3vedi', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002mu27smvf6vnt2', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002nu27sd32eudhx', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002ou27sdn1xstqk', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002pu27say319yb6', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002qu27szepxtmt7', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002ru27s64n5bhqc', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002su27sv1wywrjn', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002tu27srqxq80c1', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002uu27sc7qkvuz5', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:09.392'),
('cmmcsqoa8002vu27s5t3hq7au', 'cmmavq5z0001gu2usal4vkm5o', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:09.392'),
('cmmcsqs5a002wu27sl136xwst', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:14.398'),
('cmmcsqs5a002xu27s68bve318', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:14.398'),
('cmmcsqs5a002yu27sgaou8wrb', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:14.398'),
('cmmcsqs5a002zu27sahlz5uwa', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0030u27s13u3f4y2', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0031u27smchn8s6e', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0032u27sa6mwdihk', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0033u27sgn6t27c4', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0034u27sak2jdnls', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0035u27spql2h7dl', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0036u27s1j6t4145', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:14.398'),
('cmmcsqs5a0037u27s1alswgec', 'cmmavql6j001hu2ussnixyfkx', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:14.398'),
('cmmcsqvq50038u27s5h2lsnkf', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:19.037'),
('cmmcsqvq50039u27s8uckuq8r', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003au27skpnop2bx', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003bu27sgfsm4oii', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003cu27s9e1owyrm', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003du27svlxvhsmk', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003eu27sfp7m11l2', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003fu27sdynhpefe', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003gu27sph7nb8bj', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003hu27sqba0av9b', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003iu27srtf0wfmd', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:19.037'),
('cmmcsqvq5003ju27skn1ltsab', 'cmmavqwtf001iu2usq6wb8e6j', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:19.037'),
('cmmcsqzzm003ku27sb5yg2kv3', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003lu27sllncu4bh', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003mu27s2fl46y8k', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003nu27sascki33k', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003ou27sqetz0ewj', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003pu27sfph1d3qa', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003qu27s53a3enoe', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003ru27sqlxw9pkp', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003su27sde8vzogg', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003tu27s7qs9kz2a', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003uu27sbmh7qun8', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:24.563'),
('cmmcsqzzm003vu27sln86ple5', 'cmmavrflf001ju2uskmprtn7v', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:24.563'),
('cmmcsr33n003wu27sxw7ilc6r', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:28.596'),
('cmmcsr33n003xu27sexv3hbqp', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:28.596'),
('cmmcsr33n003yu27s7d0n8zhs', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:28.596'),
('cmmcsr33n003zu27sg4sphzc4', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:28.596'),
('cmmcsr33o0040u27swuraikpz', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:28.596'),
('cmmcsr33o0041u27sdqhbc6p7', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:28.596'),
('cmmcsr33o0042u27s41d2k2gu', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:28.596'),
('cmmcsr33o0043u27s6dnsvkao', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:28.596'),
('cmmcsr33o0044u27s3niog8hg', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:28.596'),
('cmmcsr33o0045u27stokshxfe', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:28.596'),
('cmmcsr33o0046u27s0jsjllyb', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:28.596'),
('cmmcsr33o0047u27smyn3xyxn', 'cmmavrtg9001ku2usbybuvk8j', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:28.596'),
('cmmcsr8qj0048u27sv2af2bbx', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:35.899'),
('cmmcsr8qj0049u27shaq8ew16', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004au27sgw0i3fje', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70ak000yu26obbti3jjz', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004bu27suns5renw', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004cu27s4b340vcw', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004du27s3wruzw9o', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70ak000zu26osulp9e23', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004eu27spj4s51j4', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004fu27s4qnmri7b', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004gu27sbrfadmy5', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70al0012u26on2c5mamw', 'cmltm70al0011u26oqip1qd6q', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004hu27swyjamllx', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000yu26obbti3jjz', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004iu27sjpzd7vs7', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70ak000zu26osulp9e23', '2026-03-05 01:38:35.899'),
('cmmcsr8qj004ju27sy8g8c7kb', 'cmmbrpgep0000u2j0oaz71g0w', NULL, 'cmltm70al0011u26oqip1qd6q', 'cmltm70al0012u26on2c5mamw', '2026-03-05 01:38:35.899');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attachments_taskId_idx` (`taskId`),
  ADD KEY `attachments_userId_idx` (`userId`);

--
-- Chỉ mục cho bảng `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_userId_idx` (`userId`),
  ADD KEY `audit_logs_entityType_entityId_idx` (`entityType`,`entityId`),
  ADD KEY `audit_logs_createdAt_idx` (`createdAt`);

--
-- Chỉ mục cho bảng `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comments_taskId_idx` (`taskId`),
  ADD KEY `comments_userId_idx` (`userId`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_userId_idx` (`userId`),
  ADD KEY `notifications_isRead_idx` (`isRead`),
  ADD KEY `notifications_createdAt_idx` (`createdAt`);

--
-- Chỉ mục cho bảng `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_key_key` (`key`),
  ADD KEY `permissions_module_idx` (`module`),
  ADD KEY `permissions_key_idx` (`key`);

--
-- Chỉ mục cho bảng `priorities`
--
ALTER TABLE `priorities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `priorities_name_key` (`name`),
  ADD KEY `priorities_position_idx` (`position`);

--
-- Chỉ mục cho bảng `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `projects_identifier_key` (`identifier`),
  ADD KEY `projects_identifier_idx` (`identifier`),
  ADD KEY `projects_creatorId_idx` (`creatorId`),
  ADD KEY `projects_isArchived_idx` (`isArchived`),
  ADD KEY `projects_isPublic_idx` (`isPublic`);

--
-- Chỉ mục cho bảng `project_members`
--
ALTER TABLE `project_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_members_projectId_userId_key` (`projectId`,`userId`),
  ADD KEY `project_members_projectId_idx` (`projectId`),
  ADD KEY `project_members_userId_idx` (`userId`),
  ADD KEY `project_members_roleId_idx` (`roleId`);

--
-- Chỉ mục cho bảng `project_trackers`
--
ALTER TABLE `project_trackers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_trackers_projectId_trackerId_key` (`projectId`,`trackerId`),
  ADD KEY `project_trackers_projectId_idx` (`projectId`),
  ADD KEY `project_trackers_trackerId_idx` (`trackerId`);

--
-- Chỉ mục cho bảng `queries`
--
ALTER TABLE `queries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `queries_projectId_idx` (`projectId`),
  ADD KEY `queries_userId_idx` (`userId`),
  ADD KEY `queries_isPublic_idx` (`isPublic`);

--
-- Chỉ mục cho bảng `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_key` (`name`),
  ADD KEY `roles_name_idx` (`name`);

--
-- Chỉ mục cho bảng `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`,`permissionId`),
  ADD KEY `role_permissions_roleId_idx` (`roleId`),
  ADD KEY `role_permissions_permissionId_idx` (`permissionId`);

--
-- Chỉ mục cho bảng `role_trackers`
--
ALTER TABLE `role_trackers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_trackers_roleId_trackerId_key` (`roleId`,`trackerId`),
  ADD KEY `role_trackers_roleId_idx` (`roleId`),
  ADD KEY `role_trackers_trackerId_idx` (`trackerId`);

--
-- Chỉ mục cho bảng `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `statuses_name_key` (`name`),
  ADD KEY `statuses_position_idx` (`position`),
  ADD KEY `statuses_isClosed_idx` (`isClosed`);

--
-- Chỉ mục cho bảng `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tasks_number_key` (`number`),
  ADD KEY `tasks_projectId_idx` (`projectId`),
  ADD KEY `tasks_assigneeId_idx` (`assigneeId`),
  ADD KEY `tasks_creatorId_idx` (`creatorId`),
  ADD KEY `tasks_statusId_idx` (`statusId`),
  ADD KEY `tasks_priorityId_idx` (`priorityId`),
  ADD KEY `tasks_trackerId_idx` (`trackerId`),
  ADD KEY `tasks_parentId_idx` (`parentId`),
  ADD KEY `tasks_versionId_idx` (`versionId`),
  ADD KEY `tasks_dueDate_idx` (`dueDate`),
  ADD KEY `tasks_isPrivate_idx` (`isPrivate`);

--
-- Chỉ mục cho bảng `time_entry_activities`
--
ALTER TABLE `time_entry_activities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `time_entry_activities_name_key` (`name`),
  ADD KEY `time_entry_activities_position_idx` (`position`);

--
-- Chỉ mục cho bảng `time_logs`
--
ALTER TABLE `time_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `time_logs_userId_idx` (`userId`),
  ADD KEY `time_logs_taskId_idx` (`taskId`),
  ADD KEY `time_logs_projectId_idx` (`projectId`),
  ADD KEY `time_logs_activityId_idx` (`activityId`),
  ADD KEY `time_logs_spentOn_idx` (`spentOn`);

--
-- Chỉ mục cho bảng `trackers`
--
ALTER TABLE `trackers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `trackers_name_key` (`name`),
  ADD KEY `trackers_position_idx` (`position`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_key` (`email`),
  ADD KEY `users_email_idx` (`email`),
  ADD KEY `users_isAdministrator_idx` (`isAdministrator`);

--
-- Chỉ mục cho bảng `versions`
--
ALTER TABLE `versions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `versions_projectId_name_key` (`projectId`,`name`),
  ADD KEY `versions_projectId_idx` (`projectId`),
  ADD KEY `versions_status_idx` (`status`);

--
-- Chỉ mục cho bảng `watchers`
--
ALTER TABLE `watchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `watchers_taskId_userId_key` (`taskId`,`userId`),
  ADD KEY `watchers_taskId_idx` (`taskId`),
  ADD KEY `watchers_userId_idx` (`userId`);

--
-- Chỉ mục cho bảng `workflow_transitions`
--
ALTER TABLE `workflow_transitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `workflow_transitions_trackerId_roleId_fromStatusId_toStatusI_key` (`trackerId`,`roleId`,`fromStatusId`,`toStatusId`),
  ADD KEY `workflow_transitions_trackerId_idx` (`trackerId`),
  ADD KEY `workflow_transitions_roleId_idx` (`roleId`),
  ADD KEY `workflow_transitions_fromStatusId_idx` (`fromStatusId`),
  ADD KEY `workflow_transitions_toStatusId_idx` (`toStatusId`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `tasks`
--
ALTER TABLE `tasks`
  MODIFY `number` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `attachments_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `attachments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `projects_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `project_members`
--
ALTER TABLE `project_members`
  ADD CONSTRAINT `project_members_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `project_members_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `project_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `project_trackers`
--
ALTER TABLE `project_trackers`
  ADD CONSTRAINT `project_trackers_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `project_trackers_trackerId_fkey` FOREIGN KEY (`trackerId`) REFERENCES `trackers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `queries`
--
ALTER TABLE `queries`
  ADD CONSTRAINT `queries_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `queries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `role_trackers`
--
ALTER TABLE `role_trackers`
  ADD CONSTRAINT `role_trackers_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_trackers_trackerId_fkey` FOREIGN KEY (`trackerId`) REFERENCES `trackers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `tasks` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_priorityId_fkey` FOREIGN KEY (`priorityId`) REFERENCES `priorities` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_statusId_fkey` FOREIGN KEY (`statusId`) REFERENCES `statuses` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_trackerId_fkey` FOREIGN KEY (`trackerId`) REFERENCES `trackers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tasks_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `versions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `time_logs`
--
ALTER TABLE `time_logs`
  ADD CONSTRAINT `time_logs_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `time_entry_activities` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `time_logs_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `time_logs_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `time_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `versions`
--
ALTER TABLE `versions`
  ADD CONSTRAINT `versions_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `watchers`
--
ALTER TABLE `watchers`
  ADD CONSTRAINT `watchers_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `tasks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `watchers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `workflow_transitions`
--
ALTER TABLE `workflow_transitions`
  ADD CONSTRAINT `workflow_transitions_fromStatusId_fkey` FOREIGN KEY (`fromStatusId`) REFERENCES `statuses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `workflow_transitions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `workflow_transitions_toStatusId_fkey` FOREIGN KEY (`toStatusId`) REFERENCES `statuses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `workflow_transitions_trackerId_fkey` FOREIGN KEY (`trackerId`) REFERENCES `trackers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
