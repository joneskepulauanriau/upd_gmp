-- phpMyAdmin SQL Dump
-- version 4.8.5
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 01, 2025 at 01:49 AM
-- Server version: 10.1.38-MariaDB
-- PHP Version: 7.2.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_gmp`
--

-- --------------------------------------------------------

--
-- Table structure for table `turnamen`
--

DROP TABLE IF EXISTS `turnamen`;
CREATE TABLE `turnamen` (
  `id_turnamen` varchar(20) NOT NULL,
  `nama_turnamen` varchar(100) NOT NULL,
  `alias` varchar(20) DEFAULT NULL,
  `tgl_turnamen` date DEFAULT NULL,
  `tgl_realisasi` date DEFAULT NULL,
  `tahun` varchar(4) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Tutup',
  `jadwal_presensi` int(11) DEFAULT '0',
  `priode_jadwal_mulai` date DEFAULT NULL,
  `priode_jadwal_selesai` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `turnamen`
--

INSERT INTO `turnamen` (`id_turnamen`, `nama_turnamen`, `alias`, `tgl_turnamen`, `tgl_realisasi`, `tahun`, `id`, `status`, `jadwal_presensi`, `priode_jadwal_mulai`, `priode_jadwal_selesai`) VALUES
('202501', 'Turnamen Perbaikan Peringkat Pertama', 'Pertama', '2025-02-24', '2025-02-24', '2025', 1, 'Selesai', 0, NULL, NULL),
('202502', 'Turnamen Perbaikan Peringkat Kedua', 'Kedua', '2025-03-28', '2025-03-28', '2025', 2, 'Selesai', 0, NULL, NULL),
('202503', 'Turnamen Perbaikan Peringkat Ketiga', 'Ketiga', '2025-05-02', '2025-05-02', '2025', 3, 'Selesai', 0, NULL, NULL),
('202504', 'Turnamen Perbaikan Peringkat Keempat', 'Keempat', '2025-05-23', '2025-05-23', '2025', 4, 'Selesai', 0, NULL, NULL),
('202505', 'Turnamen Perbaikan Peringkat Kelima', 'Kelima', '2025-06-20', '2025-06-20', '2025', 5, 'Selesai', 0, '2025-05-26', '2025-06-19'),
('202506', 'Turnamen Perbaikan Peringkat Keenam', 'Keenam', '2025-07-25', '2025-07-25', '2025', 6, 'Selesai', 0, '2025-06-23', '2025-07-24'),
('202507', 'Turnamen Perbaikan Peringkat Ketujuh', 'Ketujuh', '2025-08-15', '2025-08-15', '2025', 7, 'Selesai', 0, '2025-07-28', '2025-08-14'),
('202508', 'Turnamen Perbaikan Peringkat Kedelapan', 'Kedelapan', '2025-09-05', '2025-09-05', '2025', 8, 'Selesai', 0, '2025-08-16', '2025-09-04'),
('202509', 'Turnamen Perbaikan Peringkat Kesembilan', 'Kesembilan', '2025-09-26', '2025-09-26', '2025', 9, 'Selesai', 0, '2025-09-06', '2025-09-25'),
('202510', 'Turnamen Perbaikan Peringkat Kesepuluh', 'Kesepuluh', '2025-10-24', '2025-10-24', '2025', 10, 'Selesai', 0, '2025-09-27', '2025-10-23'),
('202511', 'Turnamen Perbaikan Peringkat Kesebelas', 'Kesebelas', '2025-11-21', '2025-11-21', '2025', 11, 'Buka', 1, '2025-10-25', '2025-11-20'),
('202512', 'Turnamen Perbaikan Peringkat Kedua Belas', 'Kedua Belas', '2025-12-12', NULL, '2025', 12, 'Tutup', 0, NULL, NULL),
('202513', 'Turnamen Beregu Duo Kemerdekaan', 'bereguduo', '2025-08-23', '2025-08-23', '2025', 13, 'Selesai', 0, '2025-08-18', '2025-08-22'),
('202514', 'Turnamen Ganda', 'ganda', '2025-11-02', '2025-11-02', '2025', 14, 'Buka', 0, '2025-11-02', '2025-11-02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `turnamen`
--
ALTER TABLE `turnamen`
  ADD PRIMARY KEY (`id_turnamen`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
